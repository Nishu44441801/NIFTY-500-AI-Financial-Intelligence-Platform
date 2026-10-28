import React from "react";
import { Search, ChevronRight, Database, Activity, ShieldAlert, Sparkles } from "lucide-react";

const QUICK_TICKERS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "BHARTIARTL",
  "SBIN",
  "LT",
  "ITC"
];

export default function HomeView({
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectTicker,
  onQuickTickerClick
}) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 sm:py-20">
      {/* Brand Heading */}
      <div className="text-center max-w-2xl mb-8">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
          screener<span className="text-emerald-600">.ai</span>
        </h1>
        <p className="text-sm text-slate-500 font-normal">
          Stock analysis and quantitative screening tool for Indian stocks.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="w-full max-w-xl relative mb-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for a company..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
            autoFocus
          />
        </div>

        {/* Dropdown Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden z-40 max-h-72 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.ticker}
                onClick={() => onSelectTicker(item.ticker)}
                className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-none transition cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                    {item.company_name || item.ticker}
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                      {item.ticker}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.sector || "NIFTY-500 Listed Equity"}
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Search Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl text-xs">
        <span className="text-slate-500 text-[11px] font-medium mr-1">Or analyse:</span>
        {QUICK_TICKERS.map((ticker) => (
          <button
            key={ticker}
            onClick={() => onQuickTickerClick(ticker)}
            className="text-[11px] bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-700 px-2.5 py-1 rounded shadow-2xs font-medium transition cursor-pointer"
          >
            {ticker}
          </button>
        ))}
      </div>

      {/* Lower Metrics Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-4xl mt-16 pt-8 border-t border-slate-200">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Database size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">5,460</div>
            <div className="text-[11px] text-slate-500">Audited Quarters (2023–2025)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">15 Ratios</div>
            <div className="text-[11px] text-slate-500">Solvency, Margins & Coverage</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">TreeSHAP</div>
            <div className="text-[11px] text-slate-500">XAI Risk & Anomaly Screener</div>
          </div>
        </div>
      </div>
    </div>
  );
}
