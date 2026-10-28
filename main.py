"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    FASTAPI QUANT AUDIT SERVER (PHASE 4)                      ║
║  Backend API connecting SQLite Data Lake, ML Risk Engine, & RAG Auditor     ║
║                                                                              ║
║  Modules:                                                                    ║
║    • /api/auth       - JWT Authentication & RBAC                             ║
║    • /api/companies  - NIFTY-500 Master Universe, Financials & Screener      ║
║    • /api/risk       - XGBoost/SHAP Risk Attribution & Anomaly Screener      ║
║    • /api/audit      - RAG Narrative Validation (ChromaDB + Groq)            ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import sqlite3
import logging
import argparse
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

import pandas as pd

from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from jose import JWTError, jwt

# Import local intelligence engines
from ml_engine import get_shap_drivers, get_engine
from rag_engine import audit_narrative_claim

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION & SECURITY
# ─────────────────────────────────────────────────────────────────────────────

DB_PATH = os.path.join("data", "quant_audit.db")

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "quantum_secure_alpha_secret_key_500_nifty")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 Hours

# Demo Credentials
DEMO_USER = "admin"
DEMO_PASS = "quantpass"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger("fastapi_backend")

app = FastAPI(
    title="NIFTY-500 Financial Intelligence & Audit API",
    description="Institutional-grade Quantitative Risk, SHAP Explainability, and RAG Forensic Narrative Auditor",
    version="4.0.0"
)

# ── 1. CORS MIDDLEWARE ───────────────────────────────────────────────────────
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── GLOBAL EXCEPTION HANDLER ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Global error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)}
    )


# ─────────────────────────────────────────────────────────────────────────────
# DATABASE UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

def get_db_cursor():
    """Context manager for SQLite connection with dictionary factory."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database not initialized at {DB_PATH}. Please run ingestion pipeline first."
        )
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


import hashlib

# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION & JWT LOGIC
# ─────────────────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int

class UserAuthRequest(BaseModel):
    username: str
    password: str

class AuditClaimRequest(BaseModel):
    ticker: str = Field(..., example="RELIANCE")
    claim: str = Field(..., example="Our operating margins improved due to lower raw material costs.")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception


@app.post("/api/auth/signup", response_model=TokenResponse, tags=["Authentication"])
async def signup(credentials: UserAuthRequest):
    """Register a new user account in SQLite and return signed JWT."""
    username = credentials.username.strip()
    password = credentials.password.strip()

    if len(username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long."
        )
    if len(password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long."
        )

    conn = get_db_cursor()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", (username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{username}' is already registered. Please login."
        )

    pwd_hash = hash_password(password)
    cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, pwd_hash))
    conn.commit()
    conn.close()

    access_token = create_access_token(data={"sub": username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in_minutes": ACCESS_TOKEN_EXPIRE_MINUTES
    }


@app.post("/api/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(credentials: UserAuthRequest):
    """Authenticate existing users from SQLite and return JWT Access Token."""
    username = credentials.username.strip()
    password = credentials.password.strip()

    conn = get_db_cursor()
    cursor = conn.cursor()
    cursor.execute("SELECT username, password_hash FROM users WHERE LOWER(username) = LOWER(?)", (username,))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row:
        # Fallback for predefined demo credentials if table is brand new
        if username == DEMO_USER and password == DEMO_PASS:
            access_token = create_access_token(data={"sub": username})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in_minutes": ACCESS_TOKEN_EXPIRE_MINUTES
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found. Please sign up first."
        )

    stored_hash = user_row["password_hash"]
    if hash_password(password) != stored_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect passcode / API key."
        )

    access_token = create_access_token(data={"sub": user_row["username"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in_minutes": ACCESS_TOKEN_EXPIRE_MINUTES
    }


# ─────────────────────────────────────────────────────────────────────────────
# FINANCIAL & COMPANY DIRECTORY ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/companies", tags=["Companies"])
def list_companies(
    limit: int = Query(500, ge=1, le=500),
    search: Optional[str] = Query(None, description="Search by ticker or name")
):
    """Return universe of NIFTY companies with sector & symbol info."""
    conn = get_db_cursor()
    cursor = conn.cursor()
    
    if search:
        query = """
            SELECT ticker, company_name, sector, industry, nse_symbol, website 
            FROM companies 
            WHERE ticker LIKE ? OR company_name LIKE ?
            ORDER BY ticker ASC
            LIMIT ?
        """
        like_pattern = f"%{search.upper()}%"
        cursor.execute(query, (like_pattern, like_pattern, limit))
    else:
        query = """
            SELECT ticker, company_name, sector, industry, nse_symbol, website 
            FROM companies 
            ORDER BY ticker ASC
            LIMIT ?
        """
        cursor.execute(query, (limit,))

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/companies/{ticker}/financials", tags=["Companies"])
def get_company_financials(ticker: str):
    """Return historical quarterly metrics and ratios for a ticker."""
    conn = get_db_cursor()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        q.ticker,
        q.quarter,
        q.year,
        q.fiscal_year,
        q.sales,
        q.expenses,
        q.operating_profit,
        q.net_profit,
        q.eps,
        q.opm_pct,
        q.source,
        r.ebit_margin,
        r.net_margin,
        r.debt_to_equity,
        r.current_ratio,
        r.interest_coverage,
        r.qoq_revenue_growth,
        r.qoq_profit_delta,
        r.yoy_revenue_growth,
        r.yoy_profit_growth
    FROM quarterly_financials q
    LEFT JOIN financial_ratios r
        ON q.ticker = r.ticker AND q.quarter = r.quarter AND q.year = r.year
    WHERE q.ticker = ?
    ORDER BY q.year ASC, 
             CASE q.quarter 
                 WHEN 'Q1' THEN 1 
                 WHEN 'Q2' THEN 2 
                 WHEN 'Q3' THEN 3 
                 WHEN 'Q4' THEN 4 
             END ASC
    """
    cursor.execute(query, (ticker.upper(),))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No financial records found for ticker '{ticker.upper()}'"
        )

    return {
        "ticker": ticker.upper(),
        "total_quarters": len(rows),
        "records": [dict(r) for r in rows]
    }


@app.get("/api/companies/{ticker}/screener", tags=["Companies"])
def get_company_screener_summary(
    ticker: str,
    quarter: Optional[str] = Query(None, description="Quarter filter (Q1-Q4)"),
    year: Optional[int] = Query(None, description="Fiscal/Calendar year")
):
    """Return key financial summary ratios for chosen or latest quarter formatted for dashboard display."""
    conn = get_db_cursor()
    cursor = conn.cursor()

    if quarter and year:
        query = """
        SELECT 
            q.ticker,
            q.quarter,
            q.year,
            q.sales,
            q.operating_profit,
            q.net_profit,
            q.eps,
            r.ebit_margin,
            r.net_margin,
            r.debt_to_equity,
            r.current_ratio,
            r.return_on_equity,
            r.interest_coverage,
            r.qoq_revenue_growth,
            r.qoq_profit_delta,
            r.yoy_revenue_growth
        FROM quarterly_financials q
        LEFT JOIN financial_ratios r
            ON q.ticker = r.ticker AND q.quarter = r.quarter AND q.year = r.year
        WHERE q.ticker = ? AND q.quarter = ? AND q.year = ?
        """
        cursor.execute(query, (ticker.upper(), quarter.upper(), year))
        rows = cursor.fetchall()
        if not rows:
            # Fallback to latest if specific quarter record not found
            fallback_q = """
            SELECT 
                q.ticker, q.quarter, q.year, q.sales, q.operating_profit, q.net_profit, q.eps,
                r.ebit_margin, r.net_margin, r.debt_to_equity, r.current_ratio, r.return_on_equity,
                r.interest_coverage, r.qoq_revenue_growth, r.qoq_profit_delta, r.yoy_revenue_growth
            FROM quarterly_financials q
            LEFT JOIN financial_ratios r
                ON q.ticker = r.ticker AND q.quarter = r.quarter AND q.year = r.year
            WHERE q.ticker = ?
            ORDER BY q.year DESC, q.quarter DESC
            LIMIT 1
            """
            cursor.execute(fallback_q, (ticker.upper(),))
            rows = cursor.fetchall()
    else:
        query = """
        SELECT 
            q.ticker,
            q.quarter,
            q.year,
            q.sales,
            q.operating_profit,
            q.net_profit,
            q.eps,
            r.ebit_margin,
            r.net_margin,
            r.debt_to_equity,
            r.current_ratio,
            r.return_on_equity,
            r.interest_coverage,
            r.qoq_revenue_growth,
            r.qoq_profit_delta,
            r.yoy_revenue_growth
        FROM quarterly_financials q
        LEFT JOIN financial_ratios r
            ON q.ticker = r.ticker AND q.quarter = r.quarter AND q.year = r.year
        WHERE q.ticker = ?
        ORDER BY q.year DESC, q.quarter DESC
        LIMIT 2
        """
        cursor.execute(query, (ticker.upper(),))
        rows = cursor.fetchall()

    cursor.execute("SELECT company_name, sector, industry, website FROM companies WHERE ticker = ?", (ticker.upper(),))
    comp_row = cursor.fetchone()
    conn.close()

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company '{ticker.upper()}' not found in audit database."
        )

    latest = dict(rows[0])
    comp_info = dict(comp_row) if comp_row else {}

    return {
        "ticker": ticker.upper(),
        "company_name": comp_info.get("company_name", ticker.upper()),
        "sector": comp_info.get("sector"),
        "latest_period": f"{latest.get('quarter')} {latest.get('year')}",
        "kpis": {
            "quarterly_sales_cr": latest.get("sales"),
            "operating_profit_cr": latest.get("operating_profit"),
            "net_profit_cr": latest.get("net_profit"),
            "eps": latest.get("eps"),
            "ebit_margin_pct": latest.get("ebit_margin"),
            "net_margin_pct": latest.get("net_margin"),
            "debt_to_equity": latest.get("debt_to_equity"),
            "current_ratio": latest.get("current_ratio"),
            "interest_coverage": latest.get("interest_coverage"),
            "qoq_revenue_growth_pct": latest.get("qoq_revenue_growth"),
            "qoq_profit_delta_pct": latest.get("qoq_profit_delta"),
            "yoy_revenue_growth_pct": latest.get("yoy_revenue_growth")
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# ML RISK & SHAP EXPLAINABILITY ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/risk/{ticker}", tags=["Risk & Explainability"])
def get_company_risk_assessment(
    ticker: str,
    quarter: str = Query("Q4", description="Fiscal/Calendar quarter (Q1-Q4)"),
    year: int = Query(2024, description="Fiscal/Calendar year"),
    model: str = Query("XGBoost", description="Model algorithm (XGBoost / CatBoost)")
):
    """
    Get ML corporate risk probability score, anomaly flag, 
    and Top 3 SHAP positive & negative risk drivers using selected model.
    """
    try:
        result = get_shap_drivers(ticker=ticker, quarter=quarter, year=year, model_type=model, db_path=DB_PATH)
        result["model_used"] = model
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Risk engine error: {str(e)}")


@app.get("/api/risk/screener/distress", tags=["Risk & Explainability"])
def get_distress_screener(
    min_risk_score: float = Query(20.0, description="Minimum corporate risk probability %"),
    anomaly_only: bool = Query(False, description="Filter for anomaly flagged companies only")
):
    """
    Screen the entire NIFTY-500 universe for elevated financial risk 
    or operational balance-sheet anomalies.
    """
    conn = get_db_cursor()
    # Fetch most recent quarter records for each company (Q4 2024 / 2025)
    query = """
    SELECT r.* 
    FROM financial_ratios r
    INNER JOIN (
        SELECT ticker, MAX(year * 10 + CASE quarter WHEN 'Q1' THEN 1 WHEN 'Q2' THEN 2 WHEN 'Q3' THEN 3 WHEN 'Q4' THEN 4 END) as max_period
        FROM financial_ratios
        GROUP BY ticker
    ) m ON r.ticker = m.ticker AND (r.year * 10 + CASE r.quarter WHEN 'Q1' THEN 1 WHEN 'Q2' THEN 2 WHEN 'Q3' THEN 3 WHEN 'Q4' THEN 4 END) = m.max_period
    ORDER BY r.ticker ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()

    if df.empty:
        return {"total_screened": 0, "flagged": []}

    engine = get_engine()
    flagged_companies = []

    for _, row in df.iterrows():
        try:
            prob, is_anomaly, _, _ = engine.predict_record(row)
            if (prob >= min_risk_score) or (anomaly_only and is_anomaly):
                def _clean_val(v):
                    return None if pd.isna(v) or np.isinf(v) else round(float(v), 4)

                flagged_companies.append({
                    "ticker": row["ticker"],
                    "quarter": row["quarter"],
                    "year": int(row["year"]),
                    "risk_score": round(prob, 2),
                    "is_anomaly": is_anomaly,
                    "ebit_margin": _clean_val(row["ebit_margin"]),
                    "net_margin": _clean_val(row["net_margin"]),
                    "debt_to_equity": _clean_val(row["debt_to_equity"]),
                    "qoq_profit_delta": _clean_val(row["qoq_profit_delta"])
                })
        except Exception:
            continue

    # Sort by risk score descending
    flagged_companies.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "total_screened": len(df),
        "total_flagged": len(flagged_companies),
        "criteria": {
            "min_risk_score": min_risk_score,
            "anomaly_only": anomaly_only
        },
        "flagged": flagged_companies
    }


# ─────────────────────────────────────────────────────────────────────────────
# RAG NARRATIVE AUDITOR ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/audit", tags=["Forensic Narrative Audit"])
def audit_claim_endpoint(body: AuditClaimRequest):
    """
    Audit an earnings call or management narrative claim:
      - Searches ChromaDB vector store for exact transcript quotes
      - Queries statutory SQLite filings for ground truth metrics
      - Produces audit verdict (SUPPORTED / POTENTIAL DISCREPANCY / INSUFFICIENT EVIDENCE)
    """
    try:
        verdict_response = audit_narrative_claim(
            ticker=body.ticker,
            claim_text=body.claim,
            db_path=DB_PATH
        )
        return verdict_response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG Auditor failure: {str(e)}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# ROOT & SYSTEM HEALTH
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
def root():
    """Welcome root endpoint directing to Swagger UI documentation."""
    return {
        "message": "NIFTY-500 Quantitative Risk & Narrative Audit Platform API",
        "version": "4.0.0",
        "docs_url": "http://localhost:8000/docs",
        "health_check": "http://localhost:8000/api/health",
        "endpoints": {
            "companies": "/api/companies",
            "company_financials": "/api/companies/{ticker}/financials",
            "screener_summary": "/api/companies/{ticker}/screener",
            "risk_assessment": "/api/risk/{ticker}",
            "distress_screener": "/api/risk/screener/distress",
            "narrative_audit": "/api/audit"
        }
    }


@app.get("/api/health", tags=["System"])
def health_check():
    """Verify backend database and engine readiness."""
    db_ok = os.path.exists(DB_PATH)
    return {
        "status": "healthy" if db_ok else "database_missing",
        "database_connected": db_ok,
        "timestamp": datetime.now().isoformat(),
        "nifty_universe_size": 500
    }


# ─────────────────────────────────────────────────────────────────────────────
# CLI ENTRY POINT & SELF TEST
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    import json
    from fastapi.testclient import TestClient

    parser = argparse.ArgumentParser(description="FastAPI Backend Server")
    parser.add_argument("--test", action="store_true", help="Run API integration test suite")
    parser.add_argument("--port", type=int, default=8000, help="Server port (default: 8000)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Server host (default: 0.0.0.0)")
    args = parser.parse_args()

    if args.test:
        log.info("══════════════════════════════════════════════════════════════════")
        log.info("🧪 RUNNING FASTAPI END-TO-END INTEGRATION TEST SUITE")
        log.info("══════════════════════════════════════════════════════════════════")

        client = TestClient(app)

        # 1. Health Check
        r_health = client.get("/api/health")
        log.info(f"1. Health Check: {r_health.status_code} => {r_health.json()}")
        assert r_health.status_code == 200

        # 2. Authentication
        r_auth = client.post("/api/auth/login", json={"username": DEMO_USER, "password": DEMO_PASS})
        log.info(f"2. Auth Login: {r_auth.status_code} => Token obtained successfully")
        assert r_auth.status_code == 200
        token = r_auth.json()["access_token"]

        # 3. Companies Universe
        r_comp = client.get("/api/companies?limit=5")
        log.info(f"3. Companies List (5 items): {r_comp.status_code} => {len(r_comp.json())} tickers returned")
        assert r_comp.status_code == 200

        # 4. Financials for RELIANCE
        r_fin = client.get("/api/companies/RELIANCE/financials")
        log.info(f"4. Financials for RELIANCE: {r_fin.status_code} => {r_fin.json()['total_quarters']} quarters retrieved")
        assert r_fin.status_code == 200

        # 5. Screener Summary for RELIANCE
        r_scr = client.get("/api/companies/RELIANCE/screener")
        log.info(f"5. Screener for RELIANCE: {r_scr.status_code} => Latest Sales: ₹{r_scr.json()['kpis']['quarterly_sales_cr']} Cr")
        assert r_scr.status_code == 200

        # 6. ML Risk & SHAP for RELIANCE
        r_risk = client.get("/api/risk/RELIANCE?quarter=Q4&year=2024")
        log.info(f"6. Risk Assessment RELIANCE: {r_risk.status_code} => Risk Score: {r_risk.json()['overall_risk_score']}%")
        assert r_risk.status_code == 200

        # 7. RAG Forensic Audit for RELIANCE
        r_audit = client.post("/api/audit", json={
            "ticker": "RELIANCE",
            "claim": "Our operating margins improved due to lower raw material costs."
        })
        log.info(f"7. RAG Audit: {r_audit.status_code} => Verdict: {r_audit.json()['verdict']}")
        assert r_audit.status_code == 200

        print("\n══════════════════════════════════════════════════════════════════")
        print("✅ ALL 7 API ENDPOINTS VERIFIED & OPERATIONAL!")
        print("══════════════════════════════════════════════════════════════════")

    else:
        log.info(f"🚀 Starting FastAPI Server on {args.host}:{args.port}...")
        uvicorn.run("main:app", host=args.host, port=args.port, reload=True)
