/**
 * @file src/components/TerminalDrawer.tsx
 * @description Luxury Raycast-inspired developer console drawer for real-time
 * server logs, mock OTP interceptor, and database events.
 */

import React, { useState, useEffect } from 'react';
import { ServerLog } from '../types';
import { api } from '../services/api';
import { Terminal, Trash2, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFillOtp?: (otp: string) => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({ isOpen, onClose, onFillOtp }) => {
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      const data = await api.getRecentLogs();
      setLogs(data);
    } catch {
      // Ignore background poll errors
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    await fetch('/api/logs/clear', { method: 'POST' });
    setLogs([]);
  };

  const handleResetDemo = async () => {
    setLoading(true);
    await api.resetDemoData();
    await fetchLogs();
    setLoading(false);
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-[#0b0d13] text-zinc-100 border border-white/[0.12] w-full sm:max-w-2xl h-[85vh] sm:h-[620px] rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <Terminal size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-zinc-200 tracking-wide">
              MiniLedger Backend Gateway & Console
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              title="Clear console"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <Trash2 size={13} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/40 border-b border-white/[0.06] text-xs">
          <span className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            PostgreSQL 16 Engine Active
          </span>

          <button
            onClick={handleResetDemo}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 font-sans text-[11px] font-semibold transition border border-white/[0.06]"
          >
            {loading ? 'Resetting...' : 'Reseed Demo Records'}
          </button>
        </div>

        {/* Logs Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
              <Terminal size={28} className="opacity-40" />
              <p className="text-xs">No recent server logs. Request an OTP or create a loan.</p>
            </div>
          ) : (
            logs.map((log) => {
              if (log.level === 'otp') {
                const otp = (log.details as any)?.otp || '';
                const phone = (log.details as any)?.phone || '';

                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 to-zinc-950 border border-amber-500/40 text-amber-200 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-amber-300 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-400" />
                        [MOCK SMS GATEWAY DISPATCH]
                      </span>
                      <span className="text-[10px] text-amber-400/60 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-zinc-300 space-y-1 mb-3 text-xs">
                      <div>Recipient: <span className="font-bold text-white">+91 {phone}</span></div>
                      <div>
                        OTP Code: <span className="text-lg font-bold tracking-[0.2em] text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-600/50 ml-1">{otp}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">Validity: 5 minutes • Printed to server terminal for assignment</div>
                    </div>

                    {onFillOtp && (
                      <button
                        onClick={() => {
                          onFillOtp(otp);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-sans text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <CheckCircle2 size={13} />
                        Auto-Fill Code ({otp}) & Continue
                      </button>
                    )}
                  </div>
                );
              }

              const isError = log.level === 'error';
              const isWarn = log.level === 'warn';

              return (
                <div key={log.id} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <span className="text-zinc-500 shrink-0 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 uppercase tracking-wider ${
                    isError
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : isWarn
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-white/[0.06] text-zinc-400'
                  }`}>
                    {log.level}
                  </span>
                  <span className={`break-all ${
                    isError ? 'text-rose-300' : isWarn ? 'text-amber-200' : 'text-zinc-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-zinc-950/90 border-t border-white/[0.06] text-[11px] text-zinc-500 flex items-center justify-between">
          <span>Backend: Express.js + PostgreSQL (PGlite)</span>
          <span>Port 3000 • JWT Bearer Auth</span>
        </div>
      </div>
    </div>
  );
};
