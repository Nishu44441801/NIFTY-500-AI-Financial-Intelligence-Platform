import sqlite3
import pandas as pd

def audit_database():
    print("🔍 Running Data Diagnostic on financials.db...\n")
    
    conn = sqlite3.connect('data/financials.db')
    
    # 1. Check total rows
    df = pd.read_sql_query("SELECT * FROM quarterly_fundamentals", conn)
    
    print(f"📊 Total Rows (Company-Quarters): {len(df)}")
    print(f"🏢 Total Unique Companies: {df['Ticker'].nunique()}")
    
    # 2. Check the Timeline
    print("\n📅 Available Timeline:")
    timeline = df.groupby(['Year', 'Quarter']).size().reset_index(name='Count')
    print(timeline.to_string(index=False))
    
    # 3. Check for Missing Values (NaNs)
    print("\n⚠️ Missing Data (Top 10 dirtiest columns):")
    missing = df.isnull().sum().sort_values(ascending=False).head(10)
    print(missing.to_string())
    
    conn.close()

if __name__ == "__main__":
    audit_database()