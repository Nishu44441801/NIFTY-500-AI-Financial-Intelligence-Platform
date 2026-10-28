import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MainDashboard from "./components/MainDashboard";
import XaiDrivers from "./components/XaiDrivers";
import TranscriptAuditor from "./components/TranscriptAuditor";
import ExecutivePdfReport from "./components/ExecutivePdfReport";

const API_BASE = "http://localhost:8000";

export default function App() {
  // Authentication First Gate: Checks active session token (sessionStorage ensures fresh visits always require login)
  const [token, setToken] = useState(() => {
    // Clear any lingering localStorage to prevent skipping login on fresh opens
    localStorage.removeItem("jwt_token");
    return sessionStorage.getItem("jwt_token") || "";
  });

  // Active Terminal State
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" | "xai" | "auditor"
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE");
  const [companies, setCompanies] = useState([]);

  // Terminal Controls
  const [fiscalYear, setFiscalYear] = useState("2024");
  const [quarter, setQuarter] = useState("Q4");
  const [sector, setSector] = useState("Energy");
  const [model, setModel] = useState("XGBoost");

  // Company Dossier Data
  const [summary, setSummary] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [riskData, setRiskData] = useState(null);

  // Peer Data for Live Scan
  const [peerData, setPeerData] = useState([
    { ticker: "RELIANCE", risk_score: "3.2", status: "STABLE", margin: "14.2%", delta: "+3.4%" },
    { ticker: "TCS", risk_score: "3.1", status: "STABLE", margin: "25.1%", delta: "-0.8%" },
    { ticker: "INFY", risk_score: "4.8", status: "STABLE", margin: "21.0%", delta: "+1.2%" },
    { ticker: "HDFCBANK", risk_score: "12.4", status: "STABLE", margin: "18.3%", delta: "+0.5%" },
    { ticker: "SBIN", risk_score: "24.6", status: "WATCH", margin: "12.8%", delta: "-4.2%" },
    { ticker: "ADANIENT", risk_score: "42.1", status: "AT RISK", margin: "4.6%", delta: "-11.8%" },
    { ticker: "BHARTIARTL", risk_score: "8.5", status: "STABLE", margin: "32.4%", delta: "+5.1%" }
  ]);

  // RAG Auditor State
  const [claim, setClaim] = useState(
    "Our operating margins improved due to lower raw material costs."
  );
  const [auditResult, setAuditResult] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // If token is set, fetch initial companies list
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/companies?limit=500`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCompanies(data);
        })
        .catch((err) => console.error("Error loading tickers:", err));
    }
  }, [token]);

  // Fetch company financial and risk records
  const loadTickerData = async (tickerSymbol) => {
    setSelectedTicker(tickerSymbol);
    try {
      const [sumRes, finRes, riskRes] = await Promise.all([
        fetch(`${API_BASE}/api/companies/${tickerSymbol}/screener?quarter=${quarter}&year=${fiscalYear}`),
        fetch(`${API_BASE}/api/companies/${tickerSymbol}/financials`),
        fetch(`${API_BASE}/api/risk/${tickerSymbol}?quarter=${quarter}&year=${fiscalYear}&model=${model}`)
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (finRes.ok) setFinancials(await finRes.json());
      if (riskRes.ok) setRiskData(await riskRes.json());
    } catch (err) {
      console.error("Error fetching dossier:", err);
    }
  };

  useEffect(() => {
    if (token) {
      loadTickerData(selectedTicker);
    }
  }, [token, selectedTicker, quarter, fiscalYear, model]);

  // Execute RAG Narrative Audit
  const handleRunAudit = async (e) => {
    e?.preventDefault();
    if (!claim.trim() || !selectedTicker) return;
    setIsAuditing(true);
    setAuditResult(null);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/audit`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ticker: selectedTicker, claim })
      });
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error("Audit error:", err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("jwt_token");
    localStorage.removeItem("jwt_token");
    setToken("");
    setSummary(null);
    setFinancials(null);
    setRiskData(null);
  };

  // ── GATE 1: SHOW LOGIN FIRST PAGE IF NOT AUTHENTICATED ──
  if (!token) {
    return <LoginPage onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  // ── GATE 2: FULL APPLICATION TERMINAL ONCE LOGGED IN ──
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121110] text-[#fef3c7] app-container">
      {/* ── PRINT-ONLY EXECUTIVE AUDIT REPORT ── */}
      <ExecutivePdfReport
        ticker={selectedTicker}
        summary={summary}
        financials={financials}
        riskData={riskData}
        quarter={quarter}
        fiscalYear={fiscalYear}
        model={model}
      />

      {/* ── PERSISTENT LEFT SIDEBAR (HIDDEN IN PRINT) ── */}
      <div className="no-print h-full flex shrink-0">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
        />
      </div>

      {/* ── MAIN WORKSPACE (HIDDEN IN PRINT) ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden terminal-interactive">
        {/* Terminal Header */}
        <Header
          selectedTicker={selectedTicker}
          onSelectTicker={loadTickerData}
          companies={companies}
          fiscalYear={fiscalYear}
          setFiscalYear={setFiscalYear}
          quarter={quarter}
          setQuarter={setQuarter}
          sector={sector}
          setSector={setSector}
          model={model}
          setModel={setModel}
        />

        {/* View Switcher Container */}
        <main className="flex-1 overflow-y-auto">
          {activeView === "dashboard" && (
            <MainDashboard
              ticker={selectedTicker}
              summary={summary}
              financials={financials}
              riskData={riskData}
              peerData={peerData}
              onSelectPeer={loadTickerData}
              quarter={quarter}
              fiscalYear={fiscalYear}
              model={model}
            />
          )}

          {activeView === "xai" && (
            <XaiDrivers
              ticker={selectedTicker}
              riskData={riskData}
              quarter={quarter}
              fiscalYear={fiscalYear}
              model={model}
            />
          )}

          {activeView === "auditor" && (
            <TranscriptAuditor
              ticker={selectedTicker}
              claim={claim}
              onClaimChange={setClaim}
              onRunAudit={handleRunAudit}
              auditResult={auditResult}
              isAuditing={isAuditing}
            />
          )}
        </main>
      </div>
    </div>
  );
}

