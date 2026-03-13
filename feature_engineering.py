import sqlite3
import pandas as pd
import numpy as np

def run_feature_engineering():
    print("🧠 Upgrading Financial Feature Engineering for NIFTY-500...")
    
    # 1. Read from the new SQLite Database, NOT the old CSV
    db_path = 'data/financials.db'
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query("SELECT * FROM quarterly_fundamentals", conn)
    except Exception as e:
        print("❌ Error: Database not found. Run your ingest script first.")
        return

    # 2. Aggressive Dimensionality Reduction (Drop >40% Missing)
    threshold = 0.40
    missing_ratios = df.isnull().mean()
    cols_to_drop = missing_ratios[missing_ratios > threshold].index
    df_clean = df.drop(columns=cols_to_drop)
    print(f"🗑️ Dropped {len(cols_to_drop)} garbage columns.")

    # 3. Sort chronologically for accurate Quarter-over-Quarter math
    df_clean['Date'] = pd.to_datetime(df_clean['Date'])
    df_clean = df_clean.sort_values(['Ticker', 'Date']).reset_index(drop=True)

    # 4. Handle Missing Values dynamically
    numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
    df_clean[numeric_cols] = df_clean.groupby('Ticker')[numeric_cols].ffill()
    df_clean[numeric_cols] = df_clean[numeric_cols].fillna(0)

    # 5. Dynamic Ratio Engineering (Protects against Bank vs. IT schema clash)
    rev_col = 'Total_Revenue' if 'Total_Revenue' in df_clean.columns else 'Operating_Revenue'
    if rev_col not in df_clean.columns and 'Interest_Income' in df_clean.columns:
        rev_col = 'Interest_Income' # Fallback for banking sector
        
    inc_col = 'Net_Income' if 'Net_Income' in df_clean.columns else numeric_cols[0]
    
    print(f"📊 Using '{rev_col}' and '{inc_col}' to calculate margins...")

    # Calculate Margins (Prevent division by zero)
    df_clean['Total_Rev_Safe'] = df_clean[rev_col].replace(0, np.nan)
    df_clean['net_margin'] = df_clean[inc_col] / df_clean['Total_Rev_Safe']
    df_clean['net_margin'] = df_clean['net_margin'].fillna(0)
    
    # Calculate Growth
    df_clean['revenue_growth_qoq'] = df_clean.groupby('Ticker')[rev_col].pct_change(fill_method=None).fillna(0)

    # 6. Target Creation: Will margin improve NEXT quarter? 
    df_clean['target_margin'] = df_clean.groupby('Ticker')['net_margin'].shift(-1)
    df_clean['target'] = (df_clean['target_margin'] > df_clean['net_margin']).astype(int)

    # 7. Final Cleaning: Drop the last quarter for each company because we can't predict its "next" quarter yet
    initial_count = len(df_clean)
    df_clean = df_clean.dropna(subset=['target_margin'])
    
    # Drop the temporary calculation columns
    df_clean = df_clean.drop(columns=['Total_Rev_Safe', 'target_margin'])

    # 8. Save back to the CSV your ML script expects
    output_path = 'data/nifty_features.csv'
    df_clean.to_csv(output_path, index=False)
    print(f"✨ Success! Saved {len(df_clean)} AI-ready rows (from {initial_count} raw rows) to {output_path}.")
    
    conn.close()

if __name__ == "__main__":
    run_feature_engineering()