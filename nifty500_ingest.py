import yfinance as yf
import pandas as pd
import sqlite3
import time
import random
import os
import glob

def fetch_nifty_500_robust(ticker_list):
    print(f"🚀 Initializing Robust NIFTY-500 ETL Pipeline...")
    
    # 1. Create a "Data Lake" directory for crash-proof saving
    os.makedirs('data/raw_tickers', exist_ok=True)
    
    success_count = 0
    fail_count = 0

    # --- PHASE 1: EXTRACT & SAVE TO DATA LAKE ---
    for i, ticker in enumerate(ticker_list, 1):
        # Fix common ticker typos (e.g., L&T -> LT)
        ticker = ticker.replace("&", "")
        
        file_path = f'data/raw_tickers/{ticker}.csv'
        
        # If script crashed previously, skip companies we already downloaded!
        if os.path.exists(file_path):
            print(f"⏭️ [{i}/{len(ticker_list)}] {ticker} already extracted. Skipping...")
            success_count += 1
            continue

        print(f"⏳ [{i}/{len(ticker_list)}] Extracting {ticker}.NS...", end=" ")
        
        try:
            stock = yf.Ticker(f"{ticker}.NS")
            income = stock.quarterly_financials
            balance = stock.quarterly_balance_sheet
            cashflow = stock.quarterly_cashflow
            
            if income.empty and balance.empty:
                print("⚠️ Skipped (No Data)")
                fail_count += 1
                continue

            # Merge tables
            combined = pd.concat([income.T, balance.T, cashflow.T], axis=1)
            combined = combined.loc[:, ~combined.columns.duplicated()]
            
            # Format rows
            combined = combined.reset_index().rename(columns={'index': 'Date'})
            combined['Ticker'] = ticker
            combined['Year'] = combined['Date'].dt.year
            combined['Quarter'] = combined['Date'].dt.month.map({3:'Q4', 6:'Q1', 9:'Q2', 12:'Q3'})
            
            # Clean column names
            combined.columns = combined.columns.str.strip().str.replace(' ', '_').str.replace('(', '').str.replace(')', '')
            
            # Save to temporary Data Lake (CSV)
            combined.to_csv(file_path, index=False)
            
            print("✅ Success")
            success_count += 1
            
        except Exception as e:
            print(f"❌ Failed: {str(e)}")
            fail_count += 1
            
        finally:
            # Rate limiting to prevent IP ban
            time.sleep(random.uniform(1.5, 4.0))

    # --- PHASE 2: COMPILE AND LOAD TO SQLITE ---
    print("\n💾 Phase 2: Compiling Data Lake into SQLite Database...")
    all_files = glob.glob("data/raw_tickers/*.csv")
    
    if not all_files:
        print("❌ No data found to compile!")
        return
        
    # Read all individual CSVs and merge them (Pandas handles missing columns automatically here)
    df_list = [pd.read_csv(f) for f in all_files]
    master_df = pd.concat(df_list, ignore_index=True)
    
    # Push the perfect, merged master table to SQLite
    conn = sqlite3.connect('data/financials.db')
    master_df.to_sql('quarterly_fundamentals', conn, if_exists='replace', index=False)
    
    # Create the high-speed index
    cursor = conn.cursor()
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_quarterly_filter ON quarterly_fundamentals (Ticker, Year, Quarter)")
    conn.commit()
    conn.close()
    
    print(f"\n🏁 ETL Complete! Success: {success_count} | Failed: {fail_count}")

if __name__ == "__main__":
    import pandas as pd
    import os
    
    csv_path = "data/ind_nifty500list.csv"
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: {csv_path} is missing.")
    else:
        # Read the NSE CSV
        nifty_df = pd.read_csv(csv_path)
        
        # 1. Strip invisible spaces from all column names (fixes dirty CSVs)
        nifty_df.columns = nifty_df.columns.str.strip()
        
        # 2. Force uppercase 'SYMBOL' to match 'Symbol' just in case
        if 'SYMBOL' in nifty_df.columns:
            nifty_df.rename(columns={'SYMBOL': 'Symbol'}, inplace=True)
            
        # 3. Ultimate Fallback: If 'Symbol' STILL isn't found, grab the very first column
        if 'Symbol' not in nifty_df.columns:
            nifty_df.rename(columns={nifty_df.columns[0]: 'Symbol'}, inplace=True)
        
        # Clean the actual rows and filter out the index row itself
        full_batch = nifty_df['Symbol'].astype(str).str.strip().tolist()
        full_batch = [ticker for ticker in full_batch if ticker != "NIFTY 500"]
        
        print(f"📊 Loaded {len(full_batch)} tickers from NSE file.")
        
        # Execute the pipeline on all companies
        fetch_nifty_500_robust(full_batch)