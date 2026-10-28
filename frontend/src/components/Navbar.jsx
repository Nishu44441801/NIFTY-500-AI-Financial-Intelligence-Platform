import React from "react";
import { LogIn, LogOut, ExternalLink, Sparkles } from "lucide-react";

export default function Navbar({ onGoHome, token, onOpenLogin, onLogout, onQuickAudit }) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand & Left Links */}
        <div className="flex items-center space-x-8">
          <button
            onClick={onGoHome}
            className="flex items-center space-x-1.5 text-left group cursor-pointer"
          >
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
              S
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              screener<span className="text-emerald-600">.ai</span>
            </span>
            <span className="ml-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
              NIFTY 500
            </span>
          </button>

          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600 tracking-wider">
            <button onClick={onGoHome} className="hover:text-emerald-600 transition cursor-pointer">
              HOME
            </button>
            <button onClick={onGoHome} className="hover:text-emerald-600 transition cursor-pointer">
              SCREENS
            </button>
            <button onClick={onGoHome} className="hover:text-emerald-600 transition cursor-pointer">
              TOOLS
            </button>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-600 transition flex items-center gap-1"
            >
              API DOCS <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {token ? (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                Admin
              </span>
              <button
                onClick={onLogout}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <LogOut size={12} /> Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="text-xs font-semibold text-slate-700 hover:text-emerald-600 border border-slate-300 hover:border-emerald-500 rounded px-3 py-1 transition flex items-center gap-1 cursor-pointer"
            >
              <LogIn size={13} /> LOGIN
            </button>
          )}

          <button
            onClick={onQuickAudit}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-1 transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Sparkles size={12} /> RELIANCE
          </button>
        </div>
      </div>
    </nav>
  );
}
