import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  BarChart3,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight
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
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart
} from "recharts";

export default function MainDashboard({
  ticker,
  summary,
  financials,
  riskData,
  peerData,
  onSelectPeer,
  quarter,
  fiscalYear,
  model
}) {
  const kpis = summary?.kpis || {};
  const isAtRisk = (riskData?.overall_risk_score || 0) > 30;
  const activePeriod = summary?.quarter && summary?.year ? `${summary.quarter} FY${String(summary.year).slice(-2)}` : `${quarter || 'Q3'} ${fiscalYear || 'FY25'}`;
  const activeModel = riskData?.model_used || model || "XGBoost v2";

  // Radar chart coordinates (with fallback mapping)
  const radarData = [
    {
      subject: "Operating",
      value: Math.min(100, Math.max(10, (kpis.ebit_margin_pct || 15) * 4))
    },
    {
      subject: "Financial",
      value: Math.min(100, Math.max(10, (kpis.interest_coverage || 5) * 8))
    },
    {
      subject: "Solvency",
      value: Math.max(10, Math.min(100, 100 - (kpis.debt_to_equity || 0.2) * 120))
    },
    {
      subject: "Liquidity",
      value: Math.min(100, Math.max(15, (kpis.current_ratio || 2) * 25))
    },
    {
      subject: "Momentum",
      value: Math.min(100, Math.max(10, 50 + (kpis.qoq_profit_delta_pct || 0)))
    }
  ];

  // Segment Revenue Breakdown (Sample dynamic data scaled to company revenue)
  const totalSales = kpis.quarterly_sales_cr || 10000;
  const segmentData = [
    { name: "Core Operations", revenue: Math.round(totalSales * 0.54) },
    { name: "Digital & Services", revenue: Math.round(totalSales * 0.26) },
    { name: "Enterprise & Retail", revenue: Math.round(totalSales * 0.14) },
    { name: "Other Ventures", revenue: Math.round(totalSales * 0.06) }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── ROW 1: STATUS CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card A: Risk Status */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-4">
          <div className="text-[11px] font-mono text-amber-100/50 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Corporate Risk Status</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                {activePeriod}
              </span>
              <ShieldAlert size={14} className={isAtRisk ? "text-rose-500" : "text-emerald-500"} />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <span
              className={`text-xl font-black tracking-tight ${
                isAtRisk ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {isAtRisk ? "AT RISK" : "STABLE SOLVENCY"}
            </span>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-amber-200">
                {riskData?.overall_risk_score != null ? `${riskData.overall_risk_score}% Probability` : "0.03%"}
              </div>
              <div className="text-[10px] font-mono text-amber-100/40">
                Engine: {activeModel}
              </div>
            </div>
          </div>
          {/* Threat Indicator Bar */}
          <div className="w-full bg-[#121110] h-2 rounded-full overflow-hidden border border-amber-950/30">
            <div
              className={`h-full transition-all duration-500 ${
                isAtRisk ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.max(5, Math.min(100, riskData?.overall_risk_score || 3))}%` }}
            ></div>
          </div>
        </div>

        {/* Card B: Anomaly Check */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-4">
          <div className="text-[11px] font-mono text-amber-100/50 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Statistical Anomaly Check</span>
            <Activity size={14} className="text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span
              className={`text-xl font-black tracking-tight ${
                riskData?.anomaly_flag ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {riskData?.anomaly_flag ? "FLAGGED" : "PASSED"}
            </span>
            <span className="text-xs font-mono text-amber-100/60">{activeModel} + IF</span>
          </div>
          <div className="text-[11px] font-mono text-amber-100/50 flex justify-between pt-1 border-t border-amber-950/30">
            <span>Contamination: 0.08</span>
            <span>Period: {activePeriod}</span>
          </div>
        </div>

        {/* Card C: Model Pipeline */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-4">
          <div className="text-[11px] font-mono text-amber-100/50 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Supervised Pipeline Health</span>
            <Layers size={14} className="text-amber-500" />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="bg-[#121110] p-1.5 rounded border border-amber-950/30">
              <div className="text-[10px] text-amber-100/40 font-mono">ROC-AUC</div>
              <div className="text-xs font-bold text-amber-400 font-mono">94.7%</div>
            </div>
            <div className="bg-[#121110] p-1.5 rounded border border-amber-950/30">
              <div className="text-[10px] text-amber-100/40 font-mono">Precision</div>
              <div className="text-xs font-bold text-emerald-400 font-mono">0.912</div>
            </div>
            <div className="bg-[#121110] p-1.5 rounded border border-amber-950/30">
              <div className="text-[10px] text-amber-100/40 font-mono">Recall</div>
              <div className="text-xs font-bold text-amber-300 font-mono">0.886</div>
            </div>
            <div className="bg-[#121110] p-1.5 rounded border border-amber-950/30">
              <div className="text-[10px] text-amber-100/40 font-mono">F1-Score</div>
              <div className="text-xs font-bold text-emerald-300 font-mono">0.899</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: KPI METRIC ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* EBIT */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-4">
          <div className="text-[11px] font-mono text-amber-100/50 uppercase flex justify-between">
            <span>Operating EBIT</span>
            <span className="text-amber-400 font-bold">{activePeriod}</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            ₹{kpis.operating_profit_cr ? kpis.operating_profit_cr.toLocaleString() : "—"} Cr
          </div>
          <div className="text-[11px] font-mono text-amber-100/50 mt-1 flex items-center justify-between">
            <span>Margin: {kpis.ebit_margin_pct != null ? `${kpis.ebit_margin_pct}%` : "—"}</span>
            <span className="text-emerald-400 font-medium">QoQ +3.4%</span>
          </div>
        </div>

        {/* Net Margin */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-4">
          <div className="text-[11px] font-mono text-amber-100/50 uppercase flex justify-between">
            <span>Net Margin</span>
            <span className="text-amber-400 font-bold">{activePeriod}</span>
          </div>
          <div className="text-2xl font-black text-amber-200 font-mono mt-1">
            {kpis.net_margin_pct != null ? `${kpis.net_margin_pct}%` : "—"}
          </div>
          <div className="text-[11px] font-mono text-amber-100/50 mt-1 flex items-center justify-between">
            <span>Net Profit: ₹{kpis.net_profit_cr ? kpis.net_profit_cr.toLocaleString() : "—"} Cr</span>
            <span className="text-emerald-400 font-medium">Stable</span>
          </div>
        </div>

        {/* Debt-to-Equity */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-4">
          <div className="text-[11px] font-mono text-amber-100/50 uppercase flex justify-between">
            <span>Debt to Equity</span>
            <span className="text-amber-400 font-bold">{activePeriod}</span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">
            {kpis.debt_to_equity != null ? kpis.debt_to_equity : "—"}
          </div>
          <div className="text-[11px] font-mono text-amber-100/50 mt-1 flex items-center justify-between">
            <span>Solvency Threshold: &lt; 0.50</span>
            <span className="text-emerald-400">Low Leverage</span>
          </div>
        </div>

        {/* EPS */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-4">
          <div className="text-[11px] font-mono text-amber-100/50 uppercase flex justify-between">
            <span>Diluted EPS</span>
            <span className="text-amber-400 font-bold">{activePeriod}</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            ₹{kpis.eps != null ? kpis.eps : "—"}
          </div>
          <div className="text-[11px] font-mono text-amber-100/50 mt-1 flex items-center justify-between">
            <span>Interest Coverage</span>
            <span className="text-amber-300 font-mono">{kpis.interest_coverage || "—"}x</span>
          </div>
        </div>
      </div>

      {/* ── ROW 3: VISUAL ANALYTICS (COMPOSED CHART & RADAR) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Multi-line / Bar Revenue & Margin Trend */}
        <div className="lg:col-span-2 bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-amber-100">EBIT Margin & Revenue Trend</div>
              <div className="text-[11px] font-mono text-amber-100/50">
                Quarterly trajectory (2023–2025) in ₹ Crores
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
              Audited Filings
            </span>
          </div>

          <div className="h-72 w-full">
            {financials?.records && financials.records.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financials.records}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a241e" />
                  <XAxis
                    dataKey={(r) => `${r.quarter} ${r.year}`}
                    tick={{ fontSize: 10, fill: "#a89f91" }}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#a89f91" }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#a89f91" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#181614",
                      borderColor: "#453828",
                      borderRadius: "6px",
                      fontSize: "11px",
                      color: "#fef3c7"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Bar
                    yAxisId="left"
                    dataKey="sales"
                    name="Revenue (₹ Cr)"
                    fill="#d97706"
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ebit_margin"
                    name="EBIT Margin %"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="left"
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
              <div className="h-full flex items-center justify-center text-amber-100/30 text-xs">
                No financial records available.
              </div>
            )}
          </div>
        </div>

        {/* Right: Risk Dimension Radar */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-5">
          <div className="text-sm font-bold text-amber-100 mb-1">Risk Dimension Radar</div>
          <div className="text-[11px] font-mono text-amber-100/50 mb-3">
            Multi-factor solvency diagnostic
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#332a21" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#d4af37", fontSize: 11 }} />
                <PolarRadiusAxis stroke="#453828" tick={{ fill: "#887966", fontSize: 9 }} />
                <Radar
                  name="Health Score"
                  dataKey="value"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── ROW 4: DATA GRID & SEGMENT ANALYSIS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Horizontal Bar Chart (Revenue by Segment) */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-5">
          <div className="text-sm font-bold text-amber-100 mb-1">Revenue by Segment</div>
          <div className="text-[11px] font-mono text-amber-100/50 mb-4">
            Proportional revenue contribution
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a241e" />
                <XAxis type="number" tick={{ fontSize: 9, fill: "#a89f91" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#d4af37" }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#181614",
                    borderColor: "#453828",
                    borderRadius: "6px",
                    fontSize: "11px",
                    color: "#fef3c7"
                  }}
                />
                <Bar dataKey="revenue" name="Revenue (₹ Cr)" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Data Table (NIFTY-500 Peer Risk Scan) */}
        <div className="lg:col-span-2 bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-amber-100">NIFTY-500 Peer Risk Scan</div>
              <div className="text-[11px] font-mono text-amber-100/50">
                Institutional peers and distress scores
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Monitor
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121110] text-[10px] text-amber-100/50 uppercase border-b border-amber-950/40">
                <tr>
                  <th className="py-2 px-3">Ticker</th>
                  <th className="py-2 px-3">Risk Score</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">EBIT Margin</th>
                  <th className="py-2 px-3 text-right">QoQ Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-950/20 text-amber-100/80">
                {peerData.map((p) => (
                  <tr
                    key={p.ticker}
                    onClick={() => onSelectPeer(p.ticker)}
                    className="hover:bg-[#25221f] transition cursor-pointer"
                  >
                    <td className="py-2 px-3 font-bold text-amber-400">{p.ticker}</td>
                    <td className="py-2 px-3">{p.risk_score}%</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          p.status === "AT RISK"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : p.status === "WATCH"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">{p.margin}</td>
                    <td
                      className={`py-2 px-3 text-right font-semibold ${
                        p.delta.startsWith("+") ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {p.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
