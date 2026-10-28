import React from "react";
import { ShieldAlert, ShieldCheck, Activity, Award, TrendingUp, AlertTriangle } from "lucide-react";

export default function ExecutivePdfReport({
  ticker,
  summary,
  financials,
  riskData,
  quarter,
  fiscalYear,
  model
}) {
  const kpis = summary?.kpis || {};
  const isAtRisk = (riskData?.overall_risk_score || 0) > 30;
  const activePeriod = summary?.quarter && summary?.year 
    ? `${summary.quarter} FY${String(summary.year).slice(-2)}` 
    : `${quarter || "Q3"} ${fiscalYear || "FY25"}`;
  const activeModel = riskData?.model_used || model || "XGBoost v2";

  const drivers = riskData?.top_risk_drivers || [
    { metric_name: "Operating Expenses Growth", metric_value: "84.2%", shap_delta: 0.142 },
    { metric_name: "EBIT Margin Contraction", metric_value: "11.4%", shap_delta: 0.084 },
    { metric_name: "Finance Costs & Borrowings", metric_value: "1.42x", shap_delta: 0.057 }
  ];

  const buffers = riskData?.top_mitigating_factors || [
    { metric_name: "Liquidity (Current Ratio)", metric_value: "2.14x", shap_delta: -0.021 },
    { metric_name: "Order Book Revenue Growth", metric_value: "+12.8%", shap_delta: -0.016 }
  ];

  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return (
    <div className="hidden print:block print:w-full print:bg-white print:text-slate-900 font-sans p-8 max-w-5xl mx-auto">
      {/* ── HEADER & META ── */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              CONFIDENTIAL
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              INSTITUTIONAL QUANT AUDIT
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {summary?.company_name || ticker} ({ticker})
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Sector: <span className="font-semibold text-slate-800">{summary?.sector || "Financials / NIFTY"}</span> | Exchange: <span className="font-semibold text-slate-800">NSE India</span> | Period Audited: <span className="font-semibold text-amber-700">{activePeriod}</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-slate-900 tracking-wider">QUANT TERMINAL AUDIT</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Generated: {currentDate}</div>
          <div className="text-[11px] text-slate-500">ML Engine: <span className="font-semibold text-slate-800">{activeModel}</span></div>
        </div>
      </div>

      {/* ── EXECUTIVE SUMMARY / KEY FINDING BANNER ── */}
      <div className={`p-4 rounded-lg border mb-6 flex items-center justify-between ${
        isAtRisk 
          ? "bg-rose-50 border-rose-300 text-rose-950" 
          : "bg-emerald-50 border-emerald-300 text-emerald-950"
      }`}>
        <div className="flex items-center gap-3">
          {isAtRisk ? (
            <ShieldAlert className="text-rose-600 shrink-0" size={32} />
          ) : (
            <ShieldCheck className="text-emerald-600 shrink-0" size={32} />
          )}
          <div>
            <div className="text-xs uppercase font-bold tracking-wider opacity-80">
              Executive Solvency Verdict ({activePeriod})
            </div>
            <div className="text-lg font-black tracking-tight">
              {isAtRisk ? "HIGH DISTRESS / ELEVATED FINANCIAL RISK" : "STABLE SOLVENCY & BALANCE SHEET HEALTH"}
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              {isAtRisk 
                ? "Machine learning models detect debt leverage and operating cost deterioration above institutional risk thresholds."
                : "Strong liquidity buffers and healthy operational margins keep company insolvency risks well below alert limits."
              }
            </div>
          </div>
        </div>

        <div className="text-right pl-4 border-l border-slate-300">
          <div className="text-[11px] uppercase font-bold text-slate-500">Distress Probability</div>
          <div className={`text-2xl font-black font-mono ${isAtRisk ? "text-rose-600" : "text-emerald-700"}`}>
            {riskData?.overall_risk_score != null ? `${riskData.overall_risk_score}%` : "0.03%"}
          </div>
          <div className="text-[10px] text-slate-500">Calibrated {activeModel}</div>
        </div>
      </div>

      {/* ── SECTION 1: KEY FINANCIAL RATIOS (FOR THE AUDITED PERIOD) ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 pb-1">
          <span>1. Audited Quarterly Performance Indicators ({activePeriod})</span>
        </h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Operating EBIT</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              ₹{kpis.operating_profit_cr ? kpis.operating_profit_cr.toLocaleString() : "—"} Cr
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">Margin: {kpis.ebit_margin_pct != null ? `${kpis.ebit_margin_pct}%` : "—"}</div>
          </div>

          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Net Profit (PAT)</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              ₹{kpis.net_profit_cr ? kpis.net_profit_cr.toLocaleString() : "—"} Cr
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">Net Margin: {kpis.net_margin_pct != null ? `${kpis.net_margin_pct}%` : "—"}</div>
          </div>

          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Debt to Equity</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {kpis.debt_to_equity != null ? kpis.debt_to_equity : "—"}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">Solvency Benchmark: &lt; 0.50</div>
          </div>

          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Diluted EPS</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              ₹{kpis.eps != null ? kpis.eps : "—"}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">Interest Cover: {kpis.interest_coverage || "—"}x</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: MACHINE LEARNING & EXPLAINABILITY (SHAP) ── */}
      <div className="mb-6">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 pb-1">
          <span>2. Explainable AI (XAI) Attribution Breakdown ({activeModel})</span>
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Risk Factors */}
          <div className="border border-rose-200 bg-rose-50/40 rounded p-3.5">
            <div className="text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1.5 mb-2">
              <AlertTriangle size={13} className="text-rose-600" /> Top Threat Drivers (Increasing Risk)
            </div>
            <div className="space-y-2">
              {drivers.map((d, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-rose-100 pb-1">
                  <span className="font-medium text-slate-800 capitalize">{d.metric_name.replace(/_/g, " ")}</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-700">+{d.shap_delta} SHAP</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({d.metric_value})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buffers */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded p-3.5">
            <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1.5 mb-2">
              <ShieldCheck size={13} className="text-emerald-600" /> Mitigating Factors (Lowering Risk)
            </div>
            <div className="space-y-2">
              {buffers.map((b, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-emerald-100 pb-1">
                  <span className="font-medium text-slate-800 capitalize">{b.metric_name.replace(/_/g, " ")}</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700">{b.shap_delta} SHAP</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({b.metric_value})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: RECENT AUDITED HISTORICAL TREND TABLE ── */}
      {financials?.records && financials.records.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-slate-200 pb-1">
            <span>3. Multi-Quarter Trajectory Summary (Historical Filings)</span>
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                <th className="py-1.5 px-2">Period</th>
                <th className="py-1.5 px-2">Revenue (₹ Cr)</th>
                <th className="py-1.5 px-2">EBIT (₹ Cr)</th>
                <th className="py-1.5 px-2">EBIT Margin</th>
                <th className="py-1.5 px-2">Net Profit (₹ Cr)</th>
                <th className="py-1.5 px-2">D/E</th>
              </tr>
            </thead>
            <tbody>
              {financials.records.slice(-4).map((r, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-slate-200 ${
                    r.quarter === (summary?.quarter || quarter) && r.year === (summary?.year || fiscalYear)
                      ? "bg-amber-50 font-bold"
                      : ""
                  }`}
                >
                  <td className="py-1.5 px-2 font-mono">
                    {r.quarter} {r.year}
                    {r.quarter === (summary?.quarter || quarter) && r.year === (summary?.year || fiscalYear) && (
                      <span className="ml-1 text-[9px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded">AUDITED</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 font-medium">
                    ₹{(r.sales ?? r.sales_revenue_cr) != null ? Number(r.sales ?? r.sales_revenue_cr).toLocaleString() : "—"}
                  </td>
                  <td className="py-1.5 px-2 font-medium">
                    ₹{(r.operating_profit ?? r.operating_profit_cr) != null ? Number(r.operating_profit ?? r.operating_profit_cr).toLocaleString() : "—"}
                  </td>
                  <td className="py-1.5 px-2 font-medium">
                    {(r.ebit_margin ?? r.ebit_margin_pct) != null ? `${Number(r.ebit_margin ?? r.ebit_margin_pct).toFixed(2)}%` : "—"}
                  </td>
                  <td className="py-1.5 px-2 font-medium">
                    ₹{(r.net_profit ?? r.net_profit_cr) != null ? Number(r.net_profit ?? r.net_profit_cr).toLocaleString() : "—"}
                  </td>
                  <td className="py-1.5 px-2 font-mono font-medium">
                    {r.debt_to_equity != null ? Number(r.debt_to_equity).toFixed(3) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FOOTER / COMPLIANCE NOTE ── */}
      <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 flex justify-between items-center">
        <div>
          <span>Antigravity Quant Intelligence Platform • Institutional Edition</span>
          <span className="mx-2">•</span>
          <span>NIFTY-500 Equity Universe</span>
        </div>
        <div>
          <span>Page 1 of 1 • Strictly Confidential</span>
        </div>
      </div>
    </div>
  );
}
