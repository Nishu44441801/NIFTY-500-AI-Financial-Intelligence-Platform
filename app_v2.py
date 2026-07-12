import streamlit as st
import sqlite3
import pandas as pd
import xgboost as xgb
import shap
import requests
import numpy as np
import warnings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import logging

# Suppress warnings
warnings.filterwarnings('ignore')
logging.getLogger("transformers").setLevel(logging.ERROR)

st.set_page_config(page_title="NIFTY-500 AI Intelligence", layout="wide")
st.title("🏦 NIFTY-500 AI Financial Intelligence Platform")

# 1. Load Data
@st.cache_data
def load_data():
    try:
        df = pd.read_csv('data/nifty_features.csv')
        return df
    except Exception as e:
        return pd.DataFrame()

df_features = load_data()
if df_features.empty:
    st.error("Feature matrix not found. Run your ETL script.")
    st.stop()

# --- NEW UI: Sector & Ticker Selection ---
st.sidebar.header("System Controls")

tickers = df_features['Ticker'].unique().tolist()

# Failsafe: Only show Sector filter if the data actually exists
if 'Sector' in df_features.columns:
    sectors = ["All Sectors"] + df_features['Sector'].dropna().unique().tolist()
    selected_sector = st.sidebar.selectbox("Filter by Sector", sectors)
    if selected_sector != "All Sectors":
        tickers = df_features[df_features['Sector'] == selected_sector]['Ticker'].unique().tolist()

selected_ticker = st.sidebar.selectbox("Select Company Ticker", tickers)

# --- NEW UI: Quarter Selection (Time Travel) ---
company_data = df_features[df_features['Ticker'] == selected_ticker].copy()

# Create a readable Period string (e.g., "2024 Q3") and sort newest to oldest
company_data['Period'] = company_data['Year'].astype(str) + " Q" + company_data['Quarter'].astype(str)
available_periods = company_data['Period'].unique().tolist()
available_periods.sort(reverse=True) 

selected_period = st.sidebar.selectbox("Select Financial Quarter to Audit", available_periods)

# --- NEW UI: Global Model Diagnostics (Quarantined from Inference) ---
st.sidebar.markdown("---")
with st.sidebar.expander("⚙️ Global Model Metrics (Test Set)"):
    st.caption("These metrics reflect the XGBoost engine's overall historical accuracy across 507 unseen testing quarters, NOT the single prediction above.")
    
    st.metric("ROC-AUC", "0.74", help="The model's overall ability to distinguish between Stable and At-Risk companies.")
    st.metric("Accuracy", "67.0%", help="The total percentage of correct predictions made during the historical testing phase.")
    st.metric("Precision", "0.71", help="When the model flags a company as 'Stable', this is how often it is actually right.")
    st.metric("Recall", "0.72", help="Out of all the companies that actually were 'Stable', this is how many the model successfully caught.")
    st.metric("F1 Score", "0.72", help="The harmonic mean of Precision and Recall. A balanced score of the model's overall accuracy.")

if st.sidebar.button("Generate RAG AI Audit"):
    with st.spinner(f"Running Analysis for {selected_ticker} ({selected_period})..."):
        
        # --- TIME-SERIES DELTA LOGIC ---
        current_index = available_periods.index(selected_period)
        has_prev_quarter = current_index < len(available_periods) - 1
        
        target_q = company_data[company_data['Period'] == selected_period].iloc[:1]
        
        if has_prev_quarter:
            prev_period = available_periods[current_index + 1]
            prev_q = company_data[company_data['Period'] == prev_period].iloc[:1]
        else:
            prev_period = "N/A"
            prev_q = None

        # Clean data for XGBoost
        drop_cols = ['Ticker', 'Date', 'Year', 'Quarter', 'target', 'Period', 'Sector']
        X_latest = target_q.drop(columns=[c for c in drop_cols if c in target_q.columns])
        X_latest = X_latest.select_dtypes(include=[np.number]).replace([np.inf, -np.inf], 0)

        # Load Model
        model = xgb.XGBClassifier()
        try:
            model.load_model("data/xgboost_financial.model")
        except:
            st.error("XGBoost model file not found.")
            st.stop()

        # Predict
        prediction = model.predict(X_latest)[0]
        dmatrix = xgb.DMatrix(X_latest)
        prob = model.get_booster().predict(dmatrix)[0]
        
        status = "🟢 STABLE / GROWING" if prediction == 1 else "🔴 AT RISK / DECLINING"
        confidence = prob * 100 if prediction == 1 else (1 - prob) * 100

        col1, col2 = st.columns(2)
        
        # --- SHAP + QoQ DELTA UI ---
        with col1:
            st.subheader(f"AI Prediction: {status}")
            st.metric("Model Confidence", f"{confidence:.1f}%")
            
            st.subheader("Key Financial Drivers (QoQ Momentum)")
            st.caption("Mathematical impacts and their trajectory since the previous quarter.")
            
            explainer = shap.TreeExplainer(model)
            shap_vals = explainer.shap_values(X_latest)
            
            shap_dict = dict(zip(X_latest.columns, shap_vals[0]))
            top_drivers = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
            
            delta_context_for_llama = []
            
            for feature, impact in top_drivers:
                # Clean the ugly database name for the UI
                clean_name = feature.replace("_", " ").title()
                
                # Calculate QoQ Delta
                current_val = target_q[feature].values[0] if feature in target_q.columns else 0
                trend_str = "(No historical data)"
                
                if has_prev_quarter and feature in prev_q.columns:
                    prev_val = prev_q[feature].values[0]
                    if prev_val != 0:
                        pct_change = ((current_val - prev_val) / abs(prev_val)) * 100
                        trend_str = f"{pct_change:+.1f}% vs {prev_period}"
                    else:
                        trend_str = "New Data Point (No Prior Baseline)"
                
                delta_context_for_llama.append(f"{clean_name}: AI Impact Score {impact:.4f} | Real Trend: {trend_str}")
                
                if impact > 0:
                    st.success(f"📈 **{clean_name}**: +{impact:.4f}  \n*Trajectory: {trend_str}*")
                else:
                    st.error(f"📉 **{clean_name}**: {impact:.4f}  \n*Trajectory: {trend_str}*")

        # --- RAG RETRIEVAL & LLAMA 3 PHASE ---
        with col2:
            st.subheader("🧠 Llama 3 Executive RAG Audit")
            
            rag_context = ""
            try:
                embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
                vector_db = Chroma(persist_directory="data/chroma_db", embedding_function=embeddings)
                docs = vector_db.similarity_search(f"financial performance, earnings, and risk outlook for {selected_ticker}", k=3)
                rag_context = "\n".join([doc.page_content for doc in docs])
            except:
                rag_context = "No specific corporate transcript found in the vector database."

            prompt = f"""
            Act as a strict Senior Financial Auditor. Review the algorithmic output AND the corporate transcript excerpts for {selected_ticker} for the period {selected_period}.
            
            Model Prediction: {status}
            
            Top 3 Mathematical Drivers & Quarter-over-Quarter Momentum:
            1. {delta_context_for_llama[0]}
            2. {delta_context_for_llama[1]}
            3. {delta_context_for_llama[2]}
            
            Corporate Context (Recent Earnings Call Excerpts):
            {rag_context}
            
            Do NOT write a massive paragraph. Write a highly readable, structured executive audit using exactly these 3 bullet points:
            - **The Numbers:** (1 sentence analyzing the SHAP drivers AND their Quarter-over-Quarter trajectory)
            - **The Narrative:** (1 sentence analyzing the CEO's corporate context)
            - **The Verdict:** (1 sentence stating the final risk outlook combining the math momentum and the narrative)
            
            Do not hallucinate external facts. Keep the tone professional, brutal, and concise.
            """
            
            try:
                response = requests.post('http://localhost:11434/api/generate', json={"model": "llama3", "prompt": prompt, "stream": False})
                if response.status_code == 200:
                    st.info(response.json()['response'])
                    with st.expander("View Raw Retrieved Context (ChromaDB)"):
                        st.write(rag_context)
                else:
                    st.error("Ollama API Error. Check terminal.")
            except:
                st.error("CRITICAL ERROR: Ollama is not running.")