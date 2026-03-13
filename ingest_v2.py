import yfinance as yf
import pandas as pd
import os

def fetch_deep_financials(ticker_list):
    print(f"🚀 Building Screener-grade dataset for {len(ticker_list)} companies...")
    all_data = []
    
    for ticker in ticker_list:
        try:
            stock = yf.Ticker(f"{ticker}.NS")
            
            # 1. Fetch & Merge Financial Tables
            combined = pd.concat([
                stock.quarterly_financials.T,
                stock.quarterly_balance_sheet.T,
                stock.quarterly_cashflow.T
            ], axis=1)
            
            combined = combined.loc[:, ~combined.columns.duplicated()]
            combined['Ticker'] = ticker
            combined = combined.reset_index().rename(columns={'index': 'Date'})
            
            # 2. Shareholding Logic
            holders = stock.major_holders
            if not holders.empty:
                combined['Promoter_Hold'] = holders.iloc[0, 0] if len(holders) > 0 else 0
                
            # 3. Create Timeline Tags
            combined['Year'] = combined['Date'].dt.year
            combined['Quarter'] = combined['Date'].dt.month.map({3:'Q4', 6:'Q1', 9:'Q2', 12:'Q3'})
            
            all_data.append(combined)
            print(f"✅ Deep Scan Complete: {ticker}")
            
        except Exception as e:
            print(f"❌ Failed: {ticker} | Error: {e}")
            
    if all_data:
        final_df = pd.concat(all_data, ignore_index=True)
        os.makedirs('data', exist_ok=True)
        # This creates the file your dashboard is missing
        final_df.to_csv('data/master_financials.csv', index=False) 
        print(f"\n💾 Saved to data/master_financials.csv")

# Test batch
test_tickers = ['RELIANCE', 'TCS', 'ADANIENT', 'SBIN', 'INFY'] 
fetch_deep_financials(test_tickers)