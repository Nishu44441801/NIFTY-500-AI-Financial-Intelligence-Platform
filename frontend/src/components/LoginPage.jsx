import React, { useState } from "react";
import { Activity, Key, ShieldCheck, Lock, User, ArrowRight, Database, Terminal } from "lucide-react";

export default function LoginPage({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!username.trim() || !password.trim()) {
      setError("Please provide both username and password.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isSignUp 
        ? "http://localhost:8000/api/auth/signup" 
        : "http://localhost:8000/api/auth/login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();

      if (res.ok && data.access_token) {
        sessionStorage.setItem("jwt_token", data.access_token);
        onLoginSuccess(data.access_token);
      } else {
        setError(data.detail || (isSignUp ? "Registration failed" : "Invalid credentials"));
      }
    } catch (err) {
      setError("Unable to connect to authentication gateway at :8000");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#121110] text-[#fef3c7] flex flex-col justify-between font-sans select-none">
      {/* Top Status Bar */}
      <div className="border-b border-amber-950/40 px-6 py-3 flex items-center justify-between text-xs font-mono text-amber-100/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-emerald-400 font-semibold">GATEWAY READY</span>
          <span className="text-amber-100/30">|</span>
          <span>NIFTY-500 Quantitative Risk & Forensic Auditor</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-amber-100/40">
          <span>SEC PROTOCOL: JWT HS256</span>
          <span>LATENCY: 4.2ms</span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#181614] border border-amber-950/60 rounded-xl p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto mb-3 shadow-inner">
              <Activity size={26} className="animate-pulse" />
            </div>
            <h1 className="text-lg font-bold tracking-widest text-amber-100 uppercase">
              QUANT TERMINAL
            </h1>
            <div className="text-[11px] font-mono text-amber-500/80 tracking-wider mt-0.5">
              INSTITUTIONAL EDITION • PORTAL ACCESS
            </div>
            <p className="text-xs text-amber-100/50 mt-2">
              {isSignUp 
                ? "Create a new institutional operator profile to access statutory models"
                : "Enter credentials to access NIFTY statutory analytics & ML models"}
            </p>
          </div>

          {/* Mode Switcher Tabs (Login vs Sign Up) */}
          <div className="flex border border-amber-950/70 rounded-lg p-1 bg-[#121110] mb-5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-1.5 text-xs font-mono font-bold rounded transition cursor-pointer ${
                !isSignUp
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-amber-100/50 hover:text-amber-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-1.5 text-xs font-mono font-bold rounded transition cursor-pointer ${
                isSignUp
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-amber-100/50 hover:text-amber-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs p-3 rounded font-mono flex items-center gap-2">
              <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs p-3 rounded font-mono flex items-center gap-2">
              <Lock size={14} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-100/60 mb-1.5 flex items-center gap-1.5">
                <User size={12} className="text-amber-500" />
                Operator Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username..."
                className="w-full bg-[#121110] border border-amber-950/60 rounded px-3 py-2.5 text-xs text-amber-100 placeholder-amber-100/20 focus:outline-none focus:border-amber-500 font-mono transition"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-100/60 mb-1.5 flex items-center gap-1.5">
                <Key size={12} className="text-amber-500" />
                Passcode / API Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passcode..."
                className="w-full bg-[#121110] border border-amber-950/60 rounded px-3 py-2.5 text-xs text-amber-100 placeholder-amber-100/20 focus:outline-none focus:border-amber-500 font-mono transition"
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-100/60 mb-1.5 flex items-center gap-1.5">
                  <Lock size={12} className="text-amber-500" />
                  Confirm Passcode
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat passcode..."
                  className="w-full bg-[#121110] border border-amber-950/60 rounded px-3 py-2.5 text-xs text-amber-100 placeholder-amber-100/20 focus:outline-none focus:border-amber-500 font-mono transition"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded text-xs transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider font-mono shadow-md disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Terminal size={14} className="animate-spin" />
                  <span>{isSignUp ? "Creating Profile..." : "Verifying Token..."}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Account & Login" : "Initialize Terminal Session"}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-amber-950/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-amber-100/40 gap-2">
        <span>© QuantTerminal Institutional Engine • NIFTY-500 Statutory Analytics</span>
        <div className="flex items-center gap-4">
          <span>DATABASE: 5,460 QUARTERS</span>
          <span>XGBOOST V2</span>
          <span>CHROMADB RAG</span>
        </div>
      </div>
    </div>
  );
}
