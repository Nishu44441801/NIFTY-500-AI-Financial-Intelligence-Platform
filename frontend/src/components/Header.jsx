import React, { useState } from "react";
import { Search, ChevronDown, Download, Zap, Database } from "lucide-react";

export default function Header({
  selectedTicker,
  onSelectTicker,
  companies,
  fiscalYear,
  setFiscalYear,
  quarter,
  setQuarter,
  sector,
  setSector,
  model,
  setModel
}) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = search.trim()
    ? companies
        .filter(
          (c) =>
            c.ticker.toLowerCase().includes(search.toLowerCase()) ||
            (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  return (
    <header className="bg-[#181614] border-b border-amber-950/40 px-6 py-3.5 flex flex-col xl:flex-row items-center justify-between gap-4">
      {/* Title & Status */}
      <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
        <div>
          <div className="text-base font-bold text-amber-100 flex items-center gap-2">
            <span>NIFTY-500 Intelligence:</span>
            <span className="text-amber-400 font-mono tracking-wider">{selectedTicker}</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Backend: FastAPI | Latency: 4.2ms (Redis Cached)
          </div>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="relative w-full max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-amber-500/50" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search NIFTY-500 ticker or equity..."
            className="w-full bg-[#121110] border border-amber-950/60 rounded px-3.5 pl-9 py-1.5 text-xs text-amber-100 placeholder-amber-100/30 focus:outline-none focus:border-amber-500/80 transition"
          />
        </div>

        {/* Real-time search dropdown */}
        {showDropdown && filtered.length > 0 && (
          <div className="absolute top-full mt-1.5 w-full bg-[#181614] border border-amber-950/80 rounded shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item.ticker}
                onClick={() => {
                  onSelectTicker(item.ticker);
                  setSearch("");
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#25221f] flex items-center justify-between border-b border-amber-950/20 text-xs transition cursor-pointer"
              >
                <div>
                  <span className="font-mono font-bold text-amber-300">{item.ticker}</span>
                  <span className="text-amber-100/70 ml-2">{item.company_name}</span>
                </div>
                <span className="text-[10px] font-mono text-amber-500/60">{item.sector || "NIFTY"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Control Selectors & Export */}
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
        {/* Fiscal Year */}
        <div className="flex items-center bg-[#121110] border border-amber-950/60 rounded px-2.5 py-1 text-xs">
          <span className="text-[10px] text-amber-100/50 mr-1.5 uppercase font-mono">FY</span>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="bg-transparent text-amber-200 focus:outline-none cursor-pointer font-mono"
          >
            <option value="2025" className="bg-[#181614]">FY25</option>
            <option value="2024" className="bg-[#181614]">FY24</option>
            <option value="2023" className="bg-[#181614]">FY23</option>
          </select>
        </div>

        {/* Quarter */}
        <div className="flex items-center bg-[#121110] border border-amber-950/60 rounded px-2.5 py-1 text-xs">
          <span className="text-[10px] text-amber-100/50 mr-1.5 uppercase font-mono">Period</span>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="bg-transparent text-amber-200 focus:outline-none cursor-pointer font-mono"
          >
            <option value="Q4" className="bg-[#181614]">Q4</option>
            <option value="Q3" className="bg-[#181614]">Q3</option>
            <option value="Q2" className="bg-[#181614]">Q2</option>
            <option value="Q1" className="bg-[#181614]">Q1</option>
          </select>
        </div>

        {/* Model */}
        <div className="flex items-center bg-[#121110] border border-amber-950/60 rounded px-2.5 py-1 text-xs">
          <Zap size={12} className="text-amber-500 mr-1.5" />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-transparent text-amber-200 focus:outline-none cursor-pointer font-mono"
          >
            <option value="XGBoost" className="bg-[#181614]">XGBoost v2</option>
            <option value="CatBoost" className="bg-[#181614]">CatBoost</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={() => {
            const originalTitle = document.title;
            const pdfFilename = `${selectedTicker}_Financial_Audit_${quarter}_${fiscalYear}`;
            document.title = pdfFilename;
            window.print();
            // Restore document title after print dialog closes
            setTimeout(() => {
              document.title = originalTitle;
            }, 1000);
          }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
        >
          <Download size={13} />
          <span>Export Executive PDF</span>
        </button>
      </div>
    </header>
  );
}
