import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report, confusion_matrix, ConfusionMatrixDisplay
import shap
import matplotlib.pyplot as plt
import numpy as np

def train_model():
    print("🧠 Initializing XGBoost Model Training...")
    
    try:
        df = pd.read_csv('data/nifty_features.csv')
    except Exception as e:
        print("❌ Error: nifty_features.csv not found.")
        return

    # Define Features (X) and Target (y)
    drop_cols = ['Ticker', 'Date', 'Year', 'Quarter', 'target']
    existing_drop_cols = [col for col in drop_cols if col in df.columns]
    
    X = df.drop(columns=existing_drop_cols)
    y = df['target']
    
    X = X.select_dtypes(include=[np.number])

    # --- THE INFINITY SANITIZER ---
    X = X.replace([np.inf, -np.inf], 0)

    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"📊 Training on {len(X_train)} quarters, Testing on {len(X_test)} quarters.")

    # Train the Model
    model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    probs = model.predict_proba(X_test)[:, 1]
    preds = (probs > 0.5).astype(int)
    
    acc = accuracy_score(y_test, preds)
    auc = roc_auc_score(y_test, probs)
    print(f"✅ Model Trained! Accuracy: {acc:.2f} | ROC-AUC: {auc:.2f}")

    # --- NEW: GENERATE CONFUSION MATRIX FOR POSTER ---
    print("🖼️ Generating Confusion Matrix...")
    cm = confusion_matrix(y_test, preds)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['Stable', 'Distress'])
    fig, ax = plt.subplots(figsize=(6, 6))
    disp.plot(cmap='Blues', ax=ax)
    plt.title(f"Confusion Matrix (Acc: {acc:.2f})")
    plt.savefig('data/confusion_matrix.png', dpi=300)
    plt.close()

    # --- GENERATE SHAP PLOT ---
    print("📈 Generating SHAP Global Feature Importance...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)
    
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_test, feature_names=X.columns, show=False)
    plt.tight_layout()
    plt.savefig('data/shap_summary.png', dpi=300)
    plt.close()
    
    # Save the model
    model.save_model("data/xgboost_financial.model")
    print("✨ Success! 'shap_summary.png' and 'confusion_matrix.png' saved to data folder.")

if __name__ == "__main__":
    train_model()