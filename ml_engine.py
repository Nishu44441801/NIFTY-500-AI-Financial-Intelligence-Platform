"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ML RISK & EXPLAINABILITY ENGINE                           ║
║  Phase 2: Isolation Forest Anomaly Detection + XGBoost + SHAP Explainability║
║                                                                              ║
║  Components:                                                                 ║
║    1. Feature Pipeline & Data Preprocessing (Median Imputer + StandardScaler)║
║    2. Pseudo-Label Composite Financial Distress Supervision                 ║
║    3. Statistical Anomaly Detection (Isolation Forest)                       ║
║    4. Corporate Risk Probability Classification (XGBoost)                    ║
║    5. TreeExplainer SHAP Risk Drivers & Mitigating Factors                   ║
║                                                                              ║
║  Model Artifact: models/risk_model.joblib                                    ║
║  Database:       data/quant_audit.db                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import sqlite3
import logging
import argparse
from typing import Dict, Any, List, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
import xgboost as xgb
import shap
import joblib

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

DB_PATH = os.path.join("data", "quant_audit.db")
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "risk_model.joblib")

# 15 Financial Ratio Metrics
RATIO_FEATURES = [
    "ebit_margin",
    "net_margin",
    "gross_margin",
    "operating_margin",
    "debt_to_equity",
    "current_ratio",
    "return_on_equity",
    "return_on_assets",
    "asset_turnover",
    "interest_coverage",
    "qoq_revenue_growth",
    "qoq_profit_delta",
    "yoy_revenue_growth",
    "yoy_profit_growth",
    "eps_growth_qoq"
]

ANOMALY_CORE_FEATURES = [
    "ebit_margin",
    "net_margin",
    "debt_to_equity",
    "current_ratio",
    "qoq_revenue_growth",
    "qoq_profit_delta"
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger("ml_engine")


# ═════════════════════════════════════════════════════════════════════════════
# 1. DATA PIPELINE & FEATURE PREPROCESSING
# ═════════════════════════════════════════════════════════════════════════════

def load_financial_dataset(db_path: str = DB_PATH) -> pd.DataFrame:
    """Load aligned quarterly financials and ratio metrics from SQLite."""
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}. Please run ingestion_engine.py first.")

    conn = sqlite3.connect(db_path)
    query = """
    SELECT 
        r.ticker,
        r.quarter,
        r.year,
        r.ebit_margin,
        r.net_margin,
        r.gross_margin,
        r.operating_margin,
        r.debt_to_equity,
        r.current_ratio,
        r.return_on_equity,
        r.return_on_assets,
        r.asset_turnover,
        r.interest_coverage,
        r.qoq_revenue_growth,
        r.qoq_profit_delta,
        r.yoy_revenue_growth,
        r.yoy_profit_growth,
        r.eps_growth_qoq,
        q.sales,
        q.expenses,
        q.operating_profit,
        q.net_profit,
        q.eps
    FROM financial_ratios r
    LEFT JOIN quarterly_financials q
        ON r.ticker = q.ticker AND r.quarter = q.quarter AND r.year = q.year
    ORDER BY r.ticker, r.year, r.quarter
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    log.info(f"Loaded {len(df)} records from {db_path} across {df['ticker'].nunique()} tickers.")
    return df


def generate_distress_labels(df: pd.DataFrame) -> pd.Series:
    """
    Generate composite financial distress pseudo-labels.
    Criteria:
      - Negative operating profitability (ebit_margin < 0 or net_margin < 0)
      - High leverage stress (debt_to_equity > 0.45 or interest_coverage < 1.5)
      - Severe profit/growth contraction (qoq_profit_delta < -30% or qoq_revenue_growth < -20%)
    """
    cond_unprofitable = (df["ebit_margin"] < 0) | (df["net_margin"] < 0)
    cond_leverage_stress = (df["debt_to_equity"] > 0.45) | ((df["interest_coverage"] < 1.5) & (df["interest_coverage"].notnull()))
    cond_sharp_contraction = (df["qoq_profit_delta"] < -30.0) | (df["qoq_revenue_growth"] < -20.0)

    # Risk pseudo-label: 1 if multiple or acute distress criteria met, else 0
    acute_distress = (df["net_margin"] < -10.0) | ((df["debt_to_equity"] > 0.6) & (df["qoq_profit_delta"] < -20.0))
    composite_distress = (cond_unprofitable.astype(int) + cond_leverage_stress.astype(int) + cond_sharp_contraction.astype(int)) >= 2

    risk_label = (acute_distress | composite_distress).astype(int)
    log.info(f"Distress Label Distribution: Distressed={risk_label.sum()} ({risk_label.mean()*100:.2f}%), Normal={(risk_label == 0).sum()}")
    return risk_label


# ═════════════════════════════════════════════════════════════════════════════
# 2. MODEL TRAINING & ARTIFACT MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

from catboost import CatBoostClassifier

class MLRiskEngine:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.preprocessor = None
        self.isolation_forest = None
        self.xgb_model = None
        self.cat_model = None
        self.feature_names = RATIO_FEATURES
        self.xgb_explainer = None
        self.cat_explainer = None

    def train_models(self, df: pd.DataFrame):
        """Train Isolation Forest, supervised XGBoost, and CatBoost."""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        X_raw = df[RATIO_FEATURES].copy()
        y = generate_distress_labels(df)

        # ── Preprocessing Pipeline: Median Imputer + StandardScaler ─────────
        self.preprocessor = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])
        
        X_proc = self.preprocessor.fit_transform(X_raw)
        X_proc_df = pd.DataFrame(X_proc, columns=RATIO_FEATURES)

        # ── Statistical Anomaly Detection (Isolation Forest) ───────────────
        log.info("Training Isolation Forest on core operational ratios...")
        core_idx = [RATIO_FEATURES.index(f) for f in ANOMALY_CORE_FEATURES]
        X_core = X_proc[:, core_idx]

        self.isolation_forest = IsolationForest(
            n_estimators=150,
            contamination=0.08,
            random_state=42,
            n_jobs=-1
        )
        self.isolation_forest.fit(X_core)

        # ── Risk Score Classification (XGBoost) ────────────────────────────
        log.info("Training XGBoost Corporate Risk Classifier...")
        self.xgb_model = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=(len(y) - sum(y)) / max(1, sum(y)),
            random_state=42,
            eval_metric="logloss"
        )
        self.xgb_model.fit(X_proc_df, y)
        self.xgb_explainer = shap.TreeExplainer(self.xgb_model)

        # ── Risk Score Classification (CatBoost) ───────────────────────────
        log.info("Training CatBoost Corporate Risk Classifier...")
        self.cat_model = CatBoostClassifier(
            iterations=150,
            depth=4,
            learning_rate=0.05,
            auto_class_weights="Balanced",
            random_seed=42,
            verbose=0
        )
        self.cat_model.fit(X_proc_df, y)
        self.cat_explainer = shap.TreeExplainer(self.cat_model)

        # ── Save Artifact ──────────────────────────────────────────────────
        artifacts = {
            "preprocessor": self.preprocessor,
            "isolation_forest": self.isolation_forest,
            "xgb_model": self.xgb_model,
            "cat_model": self.cat_model,
            "feature_names": RATIO_FEATURES,
            "core_features": ANOMALY_CORE_FEATURES
        }
        joblib.dump(artifacts, self.model_path)
        log.info(f"Model artifact successfully saved to {self.model_path}")

    def load_models(self):
        """Load trained models from joblib file."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file {self.model_path} not found. Please train first.")
        artifacts = joblib.load(self.model_path)
        self.preprocessor = artifacts["preprocessor"]
        self.isolation_forest = artifacts["isolation_forest"]
        self.xgb_model = artifacts["xgb_model"]
        self.cat_model = artifacts.get("cat_model")
        self.feature_names = artifacts["feature_names"]
        self.xgb_explainer = shap.TreeExplainer(self.xgb_model)
        if self.cat_model:
            self.cat_explainer = shap.TreeExplainer(self.cat_model)
        log.info(f"Loaded trained models from {self.model_path}")

    def predict_record(self, record_series: pd.Series, model_type: str = "XGBoost") -> Tuple[float, bool, np.ndarray, np.ndarray]:
        """
        Compute risk probability, anomaly flag, and SHAP values for a single record using chosen model.
        """
        feature_df = pd.DataFrame([record_series[self.feature_names].to_dict()])
        X_proc = self.preprocessor.transform(feature_df)
        X_proc_df = pd.DataFrame(X_proc, columns=self.feature_names)

        # 1. Model Risk Probability Score (0.0 to 100.0%)
        target_model = self.cat_model if (model_type == "CatBoost" and self.cat_model) else self.xgb_model
        prob = float(target_model.predict_proba(X_proc_df)[0][1] * 100.0)

        # 2. Isolation Forest Anomaly Detection
        core_idx = [self.feature_names.index(f) for f in ANOMALY_CORE_FEATURES]
        X_core = X_proc[:, core_idx]
        anomaly_pred = self.isolation_forest.predict(X_core)[0]
        is_anomaly = bool(anomaly_pred == -1)

        # 3. SHAP Feature Attribution
        target_explainer = self.cat_explainer if (model_type == "CatBoost" and self.cat_explainer) else self.xgb_explainer
        shap_values = target_explainer.shap_values(X_proc_df)
        if isinstance(shap_values, list):
            shap_vals = shap_values[1][0]
        elif len(shap_values.shape) == 2:
            shap_vals = shap_values[0]
        else:
            shap_vals = shap_values

        return prob, is_anomaly, shap_vals, feature_df.iloc[0].values


# ═════════════════════════════════════════════════════════════════════════════
# 3. SHAP RISK DRIVERS & EXPLAINABILITY API
# ═════════════════════════════════════════════════════════════════════════════

_GLOBAL_ENGINE = None

def get_engine() -> MLRiskEngine:
    global _GLOBAL_ENGINE
    if _GLOBAL_ENGINE is None:
        _GLOBAL_ENGINE = MLRiskEngine()
        if os.path.exists(MODEL_PATH):
            _GLOBAL_ENGINE.load_models()
        else:
            df = load_financial_dataset()
            _GLOBAL_ENGINE.train_models(df)
    return _GLOBAL_ENGINE


def get_shap_drivers(ticker: str, quarter: str, year: int, model_type: str = "XGBoost", db_path: str = DB_PATH) -> Dict[str, Any]:
    """
    Calculate exact feature attributions for any requested company quarter using chosen model.
    """
    engine = get_engine()

    conn = sqlite3.connect(db_path)
    query = """
    SELECT * FROM financial_ratios 
    WHERE ticker = ? AND quarter = ? AND year = ?
    """
    df_quarter = pd.read_sql_query(query, conn, params=(ticker.upper(), quarter.upper(), year))
    conn.close()

    if df_quarter.empty:
        raise ValueError(f"No financial record found for {ticker} {quarter} {year} in {db_path}.")

    record = df_quarter.iloc[0]
    risk_score, is_anomaly, shap_vals, raw_vals = engine.predict_record(record, model_type=model_type)

    # Pair metrics with their SHAP attributions
    attribution_list = []
    for feat_name, shap_delta, raw_val in zip(engine.feature_names, shap_vals, raw_vals):
        val_display = None if pd.isna(raw_val) else round(float(raw_val), 4)
        attribution_list.append({
            "metric_name": feat_name,
            "metric_value": val_display,
            "shap_delta": round(float(shap_delta), 4)
        })

    # Sort positive contributions (pushing risk UP) and negative (pulling risk DOWN)
    risk_drivers = sorted(
        [item for item in attribution_list if item["shap_delta"] > 0],
        key=lambda x: x["shap_delta"],
        reverse=True
    )[:3]

    mitigating_factors = sorted(
        [item for item in attribution_list if item["shap_delta"] < 0],
        key=lambda x: x["shap_delta"]
    )[:3]

    result = {
        "ticker": ticker.upper(),
        "quarter": quarter.upper(),
        "year": int(year),
        "overall_risk_score": round(risk_score, 2),
        "anomaly_flag": is_anomaly,
        "top_risk_drivers": risk_drivers,
        "top_mitigating_factors": mitigating_factors
    }
    return result


# ═════════════════════════════════════════════════════════════════════════════
# 4. CLI VERIFICATION SCRIPT
# ═════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ML Corporate Risk & Explainability Engine")
    parser.add_argument("--test", action="store_true", help="Run end-to-end training and evaluate RELIANCE & TCS")
    parser.add_argument("--train", action="store_true", help="Force train and save models to models/risk_model.joblib")
    parser.add_argument("--ticker", type=str, help="Explain risk for a specific ticker")
    parser.add_argument("--quarter", type=str, default="Q4", help="Quarter (e.g., Q4)")
    parser.add_argument("--year", type=int, default=2024, help="Fiscal/Calendar Year (e.g., 2024)")
    args = parser.parse_args()

    if args.train or args.test:
        log.info("══════════════════════════════════════════════════════════════════")
        log.info("🚀 PHASE 2: TRAINING ML RISK & EXPLAINABILITY ENGINE")
        log.info("══════════════════════════════════════════════════════════════════")
        df_all = load_financial_dataset()
        engine = MLRiskEngine()
        engine.train_models(df_all)

    if args.test:
        log.info("\n══════════════════════════════════════════════════════════════════")
        log.info("🔍 EVALUATION & SHAP EXPLAINABILITY TEST (Q4 2024)")
        log.info("══════════════════════════════════════════════════════════════════")
        test_cases = [("RELIANCE", "Q4", 2024), ("TCS", "Q4", 2024)]
        for t, q, y in test_cases:
            try:
                res = get_shap_drivers(t, q, y)
                print(f"\n─────────────────── {t} ({q} {y}) ───────────────────")
                print(json.dumps(res, indent=2))
            except Exception as e:
                log.error(f"Failed to explain {t} {q} {y}: {e}")

    elif args.ticker:
        res = get_shap_drivers(args.ticker, args.quarter, args.year)
        print(f"\n─────────────────── {args.ticker.upper()} ({args.quarter.upper()} {args.year}) ───────────────────")
        print(json.dumps(res, indent=2))
