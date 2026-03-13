import pandas as pd
import xgboost as xgb
import shap
import requests
import numpy as np
import warnings

# Suppress annoying library warnings in the terminal
warnings.filterwarnings('ignore')

def generate_audit(ticker):
    print(f"🧠 Initiating AI Reasoning for {ticker}...")
    
    # 1. Load the Engineered Features
    try:
        df = pd.read_csv('data/nifty_features.csv')
        company_data = df[df['Ticker'] == ticker].copy()
        if company_data.empty:
            print(f"❌ Error: {ticker} not found in feature matrix.")
            return
    except Exception as e:
        print("❌ Error: nifty_features.csv not found.")
        return
        
    # Get the most recent quarter for the audit
    latest_q = company_data.iloc[-1:]
    
    # Isolate the numeric features
    drop_cols = ['Ticker', 'Date', 'Year', 'Quarter', 'target']
    X_latest = latest_q.drop(columns=[c for c in drop_cols if c in latest_q.columns])
    X_latest = X_latest.select_dtypes(include=[np.number])
    X_latest = X_latest.replace([np.inf, -np.inf], 0) # Sanitize

    # 2. Load the Trained XGBoost Model
    model = xgb.XGBClassifier()
    try:
        model.load_model("data/xgboost_financial.model")
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return
    
    # 3. Make the Prediction (Bypass the Scikit-Learn Wrapper)
    prediction = model.predict(X_latest)[0]
    
    # Talk directly to the C++ Booster engine to get the exact probability
    dmatrix = xgb.DMatrix(X_latest)
    prob = model.get_booster().predict(dmatrix)[0]
    
    status = "STABLE/GROWING" if prediction == 1 else "AT RISK/DECLINING"
    
    # 4. Local SHAP (Why did it make this prediction?)
    explainer = shap.TreeExplainer(model)
    shap_vals = explainer.shap_values(X_latest)
    
    # Map SHAP values to feature names and get the top 3 driving factors
    feature_names = X_latest.columns
    shap_dict = dict(zip(feature_names, shap_vals[0]))
    sorted_shap = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    top_drivers = sorted_shap[:3]

    # 5. Construct the Strict Prompt for Llama 3
    prompt = f"""
    Act as a strict Senior Financial Auditor. Review the following algorithmic output for {ticker}.
    
    Model Prediction: {status} (Confidence: {prob:.2f})
    
    Top 3 Mathematical Drivers (SHAP Values):
    1. {top_drivers[0][0]}: {top_drivers[0][1]:.4f} impact
    2. {top_drivers[1][0]}: {top_drivers[1][1]:.4f} impact
    3. {top_drivers[2][0]}: {top_drivers[2][1]:.4f} impact
    
    Write a concise, 3-sentence professional audit explaining what this means for the company's immediate future based STRICTLY on these 3 metrics. No fluff. Do not hallucinate external data.
    """
    
    # 6. Call Local Llama 3 via Ollama API
    print(f"🤖 Sending SHAP metrics to local Llama 3 engine...")
    try:
        # Note: 'llama3' is the default model name. If you use llama3.1 or llama2, change it here.
        response = requests.post('http://localhost:11434/api/generate', 
            json={
                "model": "llama3", 
                "prompt": prompt,
                "stream": False
            })
        
        if response.status_code == 200:
            result = response.json()['response']
            print("\n📝 ---------------- FINAL AUDIT REPORT ---------------- 📝\n")
            print(result)
            print("\n----------------------------------------------------------")
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ CRITICAL ERROR: Ollama is not running. Start the Ollama app on your computer before running this.")

if __name__ == "__main__":
    # Test the pipeline on Reliance Industries
    generate_audit("RELIANCE")