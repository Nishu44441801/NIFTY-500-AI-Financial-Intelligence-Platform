import React from "react";
import { LayoutDashboard, Sliders, FileText, LogOut, Activity } from "lucide-react";

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  const navItems = [
    { id: "dashboard", label: "Main Dashboard", icon: LayoutDashboard },
    { id: "xai", label: "XAI Drivers", icon: Sliders },
    { id: "auditor", label: "Transcript Auditor", icon: FileText }
  ];

  return (
    <aside className="w-64 bg-[#181614] border-r border-amber-950/40 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-amber-950/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest text-amber-100 uppercase">
              QUANT TERMINAL
            </div>
            <div className="text-[10px] font-mono text-amber-500/80 tracking-wider">
              INSTITUTIONAL EDITION
            </div>
          </div>
        </div>

        {/* Navigation Items (Clean: No Auth tab inside terminal) */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold"
                    : "text-amber-100/70 hover:bg-[#1f1d1b] hover:text-amber-200 border border-transparent"
                }`}
              >
                <Icon size={16} className={isActive ? "text-amber-400" : "text-amber-500/60"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Pill Badge & Disconnect Option */}
      <div className="p-4 border-t border-amber-950/40 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-amber-100/60">
          <span>Engine Status</span>
          <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            SYSTEM ONLINE
          </span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded text-[11px] font-mono text-amber-100/60 hover:text-rose-400 hover:bg-rose-950/30 border border-amber-950/40 hover:border-rose-900/40 transition cursor-pointer"
        >
          <LogOut size={12} />
          <span>Disconnect Session</span>
        </button>
      </div>
    </aside>
  );
}
