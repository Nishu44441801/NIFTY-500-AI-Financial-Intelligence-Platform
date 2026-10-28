import React, { useState } from "react";
import {
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Database,
  Search,
  Sparkles,
  Terminal,
  Activity
} from "lucide-react";

export default function TranscriptAuditor({
  ticker,
  claim,
  onClaimChange,
  onRunAudit,
  auditResult,
  isAuditing
}) {
  const [transcriptFilter, setTranscriptFilter] = useState("");

  const sampleTranscriptParagraphs = [
    {
      speaker: "Sh V. Srikanth, CFO",
      time: "00:04:12",
      text: "Our operating performance for the quarter was robust with revenue growth across major verticals. Effective EBITDA margins improved 160 basis points to 9.6% driven by disciplined raw material procurement and supply chain optimization."
    },
    {
      speaker: "Sh B. Srinivasan, President",
      time: "00:12:35",
      text: "On the balance sheet, our net debt position remains comfortably below statutory covenants. Our interest coverage ratio exceeds 5.5x and liquidity buffers provide headroom for ongoing capital expenditures."
    },
    {
      speaker: "Analyst Question (Morgan Stanley)",
      time: "00:28:40",
      text: "Could management provide color on how margin pressure from petrochem and refining crack spreads will be managed over the subsequent two quarters?"
    },
    {
      speaker: "Management Response",
      time: "00:30:15",
      text: "Downstream chemical margins face cyclical headwinds, but our integrated feed flexibility allows switching between ethane and propane to protect gross spreads."
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-base font-bold text-amber-100 flex items-center gap-2">
            <FileText size={18} className="text-amber-500" />
            <span>Forensic Transcript Auditor:</span>
            <span className="text-amber-400 font-mono">{ticker}</span>
          </div>
          <div className="text-[11px] font-mono text-amber-100/50 mt-0.5">
            Vector Similarity Retrieval (ChromaDB) cross-examined against statutory SQLite filings
          </div>
        </div>

        <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded flex items-center gap-1.5">
          <Terminal size={12} />
          <span>Vector Index: 78 Chunks Active</span>
        </div>
      </div>

      {/* ── SPLIT LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: TRANSCRIPT READER */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-5 flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-amber-950/40 mb-3">
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-amber-500" />
              Earnings Call Transcript Log
            </span>
            <span className="text-[10px] font-mono text-amber-100/40">Q3 / Q4 2024</span>
          </div>

          {/* Transcript Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 text-amber-100/40" size={13} />
            <input
              type="text"
              value={transcriptFilter}
              onChange={(e) => setTranscriptFilter(e.target.value)}
              placeholder="Search transcript text..."
              className="w-full bg-[#121110] border border-amber-950/50 rounded pl-8 pr-3 py-1.5 text-xs text-amber-100 placeholder-amber-100/30 focus:outline-none focus:border-amber-500/70"
            />
          </div>

          {/* Transcript Paragraphs */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {sampleTranscriptParagraphs
              .filter(
                (p) =>
                  !transcriptFilter ||
                  p.text.toLowerCase().includes(transcriptFilter.toLowerCase()) ||
                  p.speaker.toLowerCase().includes(transcriptFilter.toLowerCase())
              )
              .map((p, i) => (
                <div
                  key={i}
                  className="bg-[#181614] border border-amber-950/30 p-3 rounded space-y-1 hover:border-amber-500/30 transition"
                >
                  <div className="flex justify-between text-[11px] font-mono text-amber-400">
                    <span className="font-semibold">{p.speaker}</span>
                    <span className="text-amber-100/40">{p.time}</span>
                  </div>
                  <p className="text-amber-100/80 leading-relaxed font-sans">{p.text}</p>
                </div>
              ))}
          </div>
        </div>

        {/* RIGHT PANEL: NARRATIVE AUDIT ENGINE */}
        <div className="bg-[#1f1d1b] border border-amber-950/40 rounded-lg p-5 flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-amber-950/40 mb-3">
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Automated Forensic Cross-Examination
            </span>
            <span className="text-[10px] font-mono text-amber-400">Llama-3.3-70B / XAI</span>
          </div>

          {/* Claim Audit Form */}
          <form onSubmit={onRunAudit} className="space-y-2 mb-4">
            <label className="block text-[11px] font-mono text-amber-100/60 uppercase">
              Claim Sentence to Cross-Examine:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={claim}
                onChange={(e) => onClaimChange(e.target.value)}
                placeholder="Enter an executive claim..."
                className="flex-1 bg-[#121110] border border-amber-950/60 rounded px-3 py-2 text-xs text-amber-100 placeholder-amber-100/30 focus:outline-none focus:border-amber-500/70"
              />
              <button
                type="submit"
                disabled={isAuditing}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isAuditing ? (
                  <>
                    <Activity size={13} className="animate-spin" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={13} />
                    <span>Cross-Check</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Audit Results Card */}
          <div className="flex-1 bg-[#181614] border border-amber-950/40 rounded-lg p-4 overflow-y-auto space-y-3.5">
            {auditResult ? (
              <>
                {/* Status Badge & Confidence */}
                <div className="flex items-center justify-between pb-2 border-b border-amber-950/40">
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded border flex items-center gap-1.5 font-mono ${
                      auditResult.verdict === "SUPPORTED"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : auditResult.verdict === "POTENTIAL DISCREPANCY"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    }`}
                  >
                    {auditResult.verdict === "SUPPORTED" && <CheckCircle2 size={13} />}
                    {auditResult.verdict === "POTENTIAL DISCREPANCY" && <AlertTriangle size={13} />}
                    {auditResult.verdict === "INSUFFICIENT EVIDENCE" && <HelpCircle size={13} />}
                    {auditResult.verdict}
                  </span>

                  <span className="text-xs font-mono text-amber-200">
                    Confidence: <span className="font-bold">{auditResult.confidence_score}%</span>
                  </span>
                </div>

                {/* Direct Citation from ChromaDB */}
                <div>
                  <div className="text-[10px] font-mono text-amber-100/50 uppercase mb-1">
                    Direct ChromaDB Transcript Citation:
                  </div>
                  <div className="bg-[#121110] border border-amber-950/30 p-2.5 rounded text-xs italic text-amber-100/90 leading-relaxed font-sans">
                    "{auditResult.transcript_evidence}"
                  </div>
                </div>

                {/* Hard Statutory Metrics */}
                <div>
                  <div className="text-[10px] font-mono text-amber-100/50 uppercase mb-1 flex items-center gap-1">
                    <Database size={11} className="text-amber-500" />
                    Statutory SQLite Ground Truth:
                  </div>
                  <div className="bg-[#121110] border border-amber-950/30 p-2.5 rounded text-xs font-mono text-emerald-400">
                    {auditResult.quantitative_fact}
                  </div>
                </div>

                {/* Recommendation Box */}
                <div>
                  <div className="text-[10px] font-mono text-amber-100/50 uppercase mb-1">
                    Analytical Recommendation:
                  </div>
                  <p className="text-xs text-amber-100/70 leading-relaxed font-sans">
                    {auditResult.reasoning}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-amber-100/30 p-4">
                <Sparkles size={28} className="text-amber-500/40 mb-2" />
                <p className="text-xs">Click "Cross-Check" above to cross-examine claims against audited financial filings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
