import React from "react";
import { X, Key } from "lucide-react";

export default function LoginModal({
  isOpen,
  onClose,
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  onLogin,
  error
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#181614] rounded-lg max-w-sm w-full p-5 shadow-2xl border border-amber-950/80 relative">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-amber-100/40 hover:text-amber-100 cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Key size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-amber-100 uppercase tracking-wider">
            Institutional Gateway
          </h3>
        </div>
        <p className="text-[11px] font-mono text-amber-100/50 mb-3.5">
          Sign in to execute forensic claim audits with JWT protection
        </p>

        {error && (
          <div className="bg-rose-950/40 text-rose-300 text-xs p-2 rounded border border-rose-900/60 mb-3 font-mono">
            {error}
          </div>
        )}

        <form onSubmit={onLogin} className="space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-amber-100/60 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-[#121110] border border-amber-950/60 rounded text-amber-100 focus:outline-none focus:border-amber-500/80 font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-amber-100/60 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-[#121110] border border-amber-950/60 rounded text-amber-100 focus:outline-none focus:border-amber-500/80 font-mono"
            />
          </div>

          <div className="text-[10px] text-amber-100/40 bg-[#121110] p-2 rounded border border-amber-950/40 font-mono">
            Demo Credentials: <span className="text-amber-300">admin / quantpass</span>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 rounded transition cursor-pointer shadow-sm uppercase font-mono tracking-wider"
          >
            Authenticate Terminal
          </button>
        </form>
      </div>
    </div>
  );
}
