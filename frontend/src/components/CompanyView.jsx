import React, { useRef, useState } from "react";
import {
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Database,
  FileText,
  ShieldAlert,
  Building
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

export default function CompanyView({
  ticker,
  summary,
  financials,
  riskData,
  auditClaim,
  onClaimChange,
  onRunAudit,
  auditResult,
  isAuditing,
  onBackToHome
}) {
  const [activeTab, setActiveTab] = useState("chart");

  const chartRef = useRef(null);
  const quartersRef = useRef(null);
  const ratiosRef = useRef(null);
  const riskRef = useRef(null);
  const auditRef = useRef(null);

  const scrollTo = (ref, tabName) => {
    setActiveTab(tabName);
    if (ref && ref.current) {
      const topOffset = ref.current.getBoundingClientRect().top + window.pageYOffset - 95;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  };

  const kpis = summary?.kpis || {};

  return (
    <div className="flex-1 pb-16">
      {/* ── TOP HERO CARD ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Company Title Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {summary?.company_name || ticker}
                </h1>
                <span className="text-xs bg-slate-100 text-slate-700 font-mono font-medium px-2 py-0.5 rounded border border-slate-200">
                  NSE: {ticker}
                </span>
                {riskData?.anomaly_flag && (
                  <span className="text-[11px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <AlertTriangle size={11} /> ANOMALY DETECTED
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>Sector: {summary?.sector || "NIFTY-500 Listed Equity"}</span>
                <span>•</span>
                <span>Period: {summary?.latest_period || "Q4 2024"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onBackToHome}
                className="text-xs border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1 rounded font-medium transition cursor-pointer"
              >
                ← Back
              </button>
              <a
                href={`https://www.screener.in/company/${ticker}/`}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded font-medium flex items-center gap-1 shadow-2xs transition"
              >
                Screener.in <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* KPI 6-BOX GRID (Screener.in Compact Layout) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100">
            {/* Sales */}
            <div className="bg-[#f8fafc] p-2.5 rounded border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">Sales (Quarterly)</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                ₹{kpis.quarterly_sales_cr ? kpis.quarterly_sales_cr.toLocaleString() : "—"} Cr
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-0.5">
                {kpis.qoq_revenue_growth_pct >= 0 ? (
                  <span className="text-emerald-600 flex items-center font-medium">
                    <ArrowUpRight size={10} />+{kpis.qoq_revenue_growth_pct}%
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center font-medium">
                    <ArrowDownRight size={10} />{kpis.qoq_revenue_growth_pct}%
                  </span>
                )}
                <span className="text-slate-400">QoQ</span>
              </div>
            </div>

            {/* Operating Margin */}
            <div className="bg-[#f8fafc] p-2.5 rounded border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">Operating Margin</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {kpis.ebit_margin_pct != null ? `${kpis.ebit_margin_pct}%` : "—"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">EBIT / Revenue</div>
            </div>

            {/* Net Profit */}
            <div className="bg-[#f8fafc] p-2.5 rounded border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">Net Profit</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                ₹{kpis.net_profit_cr ? kpis.net_profit_cr.toLocaleString() : "—"} Cr
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-0.5">
                {kpis.qoq_profit_delta_pct >= 0 ? (
                  <span className="text-emerald-600 flex items-center font-medium">
                    <ArrowUpRight size={10} />+{kpis.qoq_profit_delta_pct}%
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center font-medium">
                    <ArrowDownRight size={10} />{kpis.qoq_profit_delta_pct}%
                  </span>
                )}
                <span className="text-slate-400">QoQ</span>
              </div>
            </div>

            {/* Debt to Equity */}
            <div className="bg-[#f8fafc] p-2.5 rounded border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">Debt to Equity</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {kpis.debt_to_equity != null ? kpis.debt_to_equity : "—"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Leverage Proxy</div>
            </div>

            {/* Interest Coverage */}
            <div className="bg-[#f8fafc] p-2.5 rounded border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">Interest Coverage</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {kpis.interest_coverage != null ? `${kpis.interest_coverage}x` : "—"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">EBIT / Interest</div>
            </div>

            {/* XGBoost Risk Score */}
            <div className="bg-[#f8fafc] p-2.5 rounded border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">ML Risk Score</div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  (riskData?.overall_risk_score || 0) > 30 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {riskData?.overall_risk_score != null ? `${riskData.overall_risk_score}%` : "—"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">XGBoost Distress</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY SUB-NAV BAR (SCREENER EXACT TABS) ── */}
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-6 overflow-x-auto text-xs font-semibold uppercase tracking-wider text-slate-600">
          <button
            onClick={() => scrollTo(chartRef, "chart")}
            className={`py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === "chart"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => scrollTo(quartersRef, "quarters")}
            className={`py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === "quarters"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Quarters
          </button>
          <button
            onClick={() => scrollTo(ratiosRef, "ratios")}
            className={`py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === "ratios"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            Ratios
          </button>
          <button
            onClick={() => scrollTo(riskRef, "risk")}
            className={`py-2.5 border-b-2 transition cursor-pointer flex items-center gap-1 ${
              activeTab === "risk"
                ? "border-purple-600 text-purple-700"
                : "border-transparent hover:text-purple-700"
            }`}
          >
            <Activity size={12} /> ML Risk & SHAP
          </button>
          <button
            onClick={() => scrollTo(auditRef, "audit")}
            className={`py-2.5 border-b-2 transition cursor-pointer flex items-center gap-1 ${
              activeTab === "audit"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent hover:text-emerald-700"
            }`}
          >
            <Sparkles size={12} /> Narrative Auditor
          </button>
        </div>
      </div>

      {/* ── STACKED CARD SECTIONS CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* SECTION A: CHART CARD */}
        <section ref={chartRef} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue & Profit Trajectory</h2>
              <p className="text-[11px] text-slate-500">
                Quarterly statutory performance (2023–2025) in ₹ Crores
              </p>
            </div>
            <div className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
              {financials?.total_quarters || 0} Quarters Available
            </div>
          </div>

          <div className="h-72 w-full">
            {financials?.records && financials.records.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financials.records}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey={(r) => `${r.quarter} ${r.year}`}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "6px",
                      fontSize: "12px",
                      boxShadow: "0 2px 4px 0 rgb(0 0 0 / 0.05)"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="sales"
                    name="Sales (₹ Cr)"
                    fill="#0284c7"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="operating_profit"
                    name="Operating Profit (₹ Cr)"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="net_profit"
                    name="Net Profit (₹ Cr)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No historical records found for this ticker.
              </div>
            )}
          </div>
        </section>

        {/* SECTION B: QUARTERLY RESULTS TABLE CARD */}
        <section
          ref={quartersRef}
          className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden"
        >
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">Quarterly Results</h2>
            <p className="text-[11px] text-slate-500">
              Consolidated financial statements reported by company
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#f8fafc] text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Metric</th>
                  {financials?.records?.map((r, i) => (
                    <th key={i} className="py-2.5 px-2.5 text-right whitespace-nowrap font-mono">
                      {r.quarter} {r.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr className="hover:bg-blue-50/30">
                  <td className="py-2 px-3 font-semibold text-slate-900 font-sans">Sales (₹ Cr)</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right">
                      {r.sales?.toLocaleString() ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50 hover:bg-blue-50/30">
                  <td className="py-2 px-3 text-slate-600 font-sans">Expenses (₹ Cr)</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right">
                      {r.expenses?.toLocaleString() ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-blue-50/30">
                  <td className="py-2 px-3 font-semibold text-slate-900 font-sans">
                    Operating Profit
                  </td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right text-emerald-700 font-semibold">
                      {r.operating_profit?.toLocaleString() ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50 hover:bg-blue-50/30">
                  <td className="py-2 px-3 text-slate-600 font-sans">OPM %</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right">
                      {r.opm_pct != null
                        ? `${r.opm_pct}%`
                        : r.ebit_margin != null
                        ? `${r.ebit_margin}%`
                        : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-blue-50/30 bg-emerald-50/20">
                  <td className="py-2 px-3 font-semibold text-slate-900 font-sans">Net Profit (₹ Cr)</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right font-bold text-slate-900">
                      {r.net_profit?.toLocaleString() ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-blue-50/30">
                  <td className="py-2 px-3 text-slate-600 font-sans">EPS in Rs</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right">
                      {r.eps ?? "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION B2: FINANCIAL RATIOS TABLE CARD */}
        <section
          ref={ratiosRef}
          className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm overflow-hidden"
        >
          <div className="mb-3">
            <h2 className="text-base font-bold text-slate-900">Financial Ratios & Momentum</h2>
            <p className="text-[11px] text-slate-500">
              Diagnostic solvency, margin, and quarter-over-quarter metrics
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#f8fafc] text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ratio / Diagnostic</th>
                  {financials?.records?.map((r, i) => (
                    <th key={i} className="py-2.5 px-2.5 text-right whitespace-nowrap font-mono">
                      {r.quarter} {r.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr className="hover:bg-blue-50/30">
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">EBIT Margin %</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right">
                      {r.ebit_margin != null ? `${r.ebit_margin}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50 hover:bg-blue-50/30">
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Net Margin %</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right">
                      {r.net_margin != null ? `${r.net_margin}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-blue-50/30">
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Debt to Equity</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right">
                      {r.debt_to_equity ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50 hover:bg-blue-50/30">
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">Interest Coverage</td>
                  {financials?.records?.map((r, i) => (
                    <td key={i} className="py-2 px-2.5 text-right">
                      {r.interest_coverage != null ? `${r.interest_coverage}x` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-blue-50/30">
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">
                    QoQ Revenue Growth %
                  </td>
                  {financials?.records?.map((r, i) => (
                    <td
                      key={i}
                      className={`py-2 px-2.5 text-right font-semibold ${
                        (r.qoq_revenue_growth || 0) < 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {r.qoq_revenue_growth != null ? `${r.qoq_revenue_growth}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/50 hover:bg-blue-50/30">
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">
                    QoQ Profit Delta %
                  </td>
                  {financials?.records?.map((r, i) => (
                    <td
                      key={i}
                      className={`py-2 px-2.5 text-right font-semibold ${
                        (r.qoq_profit_delta || 0) < 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {r.qoq_profit_delta != null ? `${r.qoq_profit_delta}%` : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION C: ML RISK ENGINE & SHAP CARD */}
        <section ref={riskRef} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  ML Corporate Risk & TreeSHAP Drivers
                </h2>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded border border-purple-200">
                  XGBoost Classifier
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Local feature attribution isolating balance-sheet risk factors
              </p>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-slate-500">Corporate Risk Score</div>
              <div
                className={`text-lg font-bold ${
                  (riskData?.overall_risk_score || 0) > 30 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {riskData?.overall_risk_score ?? "0.00"}%
              </div>
            </div>
          </div>

          {/* Red & Green Attribution Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Drivers */}
            <div className="border border-rose-100 bg-rose-50/20 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs mb-2.5">
                <AlertTriangle size={14} /> Top Risk Drivers (Pushing Risk UP)
              </div>
              {riskData?.top_risk_drivers && riskData.top_risk_drivers.length > 0 ? (
                <div className="space-y-2">
                  {riskData.top_risk_drivers.map((d, i) => (
                    <div
                      key={i}
                      className="bg-white p-2.5 rounded border border-rose-200 shadow-2xs flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 capitalize">
                          {d.metric_name.replace(/_/g, " ")}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Value: {d.metric_value ?? "N/A"}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-mono">
                        +{d.shap_delta}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No acute negative risk drivers.</p>
              )}
            </div>

            {/* Mitigating Factors */}
            <div className="border border-emerald-100 bg-emerald-50/20 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-2.5">
                <CheckCircle2 size={14} /> Top Mitigating Factors (Pulling Risk DOWN)
              </div>
              {riskData?.top_mitigating_factors && riskData.top_mitigating_factors.length > 0 ? (
                <div className="space-y-2">
                  {riskData.top_mitigating_factors.map((m, i) => (
                    <div
                      key={i}
                      className="bg-white p-2.5 rounded border border-emerald-200 shadow-2xs flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 capitalize">
                          {m.metric_name.replace(/_/g, " ")}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Value: {m.metric_value ?? "N/A"}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">
                        {m.shap_delta}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No strong mitigating factors.</p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION D: RAG NARRATIVE AUDITOR CARD */}
        <section ref={auditRef} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Forensic Earnings Narrative Auditor
              </h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Sparkles size={10} /> RAG + Statutory Cross-Check
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cross-examine management claims against ChromaDB transcripts and audited metrics
            </p>
          </div>

          <form onSubmit={onRunAudit} className="space-y-2.5 mb-5">
            <label className="block text-xs font-semibold text-slate-700">
              Earnings Call Claim to Verify:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={auditClaim}
                onChange={(e) => onClaimChange(e.target.value)}
                placeholder="Enter executive statement..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isAuditing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAuditing ? (
                  <>
                    <Activity className="animate-spin" size={13} /> Auditing...
                  </>
                ) : (
                  <>
                    <ShieldAlert size={13} /> Audit Claim
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Audit Result Display Box */}
          {auditResult && (
            <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">VERDICT:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded border flex items-center gap-1 ${
                      auditResult.verdict === "SUPPORTED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : auditResult.verdict === "POTENTIAL DISCREPANCY"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-slate-100 text-slate-800 border-slate-300"
                    }`}
                  >
                    {auditResult.verdict === "SUPPORTED" && <CheckCircle2 size={13} />}
                    {auditResult.verdict === "POTENTIAL DISCREPANCY" && <AlertTriangle size={13} />}
                    {auditResult.verdict === "INSUFFICIENT EVIDENCE" && <HelpCircle size={13} />}
                    {auditResult.verdict}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  Confidence: <span className="font-bold">{auditResult.confidence_score}%</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                  <Database size={11} className="text-emerald-600" /> Statutory Filing Metric:
                </div>
                <div className="text-xs bg-white p-2.5 rounded border border-slate-200 font-mono text-slate-800">
                  {auditResult.quantitative_fact}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                  <FileText size={11} className="text-blue-600" /> ChromaDB Transcript Excerpt:
                </div>
                <div className="text-xs bg-white p-2.5 rounded border border-slate-200 italic text-slate-700 leading-relaxed">
                  "{auditResult.transcript_evidence}"
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-700 mb-0.5">
                  Analytical Justification:
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{auditResult.reasoning}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
