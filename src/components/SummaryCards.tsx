/**
 * @file src/components/SummaryCards.tsx
 * @description Luxury financial summary cards with tabular numerals and refined hairline surfaces.
 */

import React from 'react';
import { FinancialSummary } from '../types';
import { formatINR } from '../utils/formatters';
import { ArrowUpRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface SummaryCardsProps {
  summary: FinancialSummary | null;
  loading?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading = false }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900/60 rounded-2xl p-3.5 border border-white/5 animate-pulse">
            <div className="h-3 w-14 bg-zinc-800 rounded-sm mb-2.5" />
            <div className="h-6 w-24 bg-zinc-800 rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 mb-4">
      {/* 1. Total Lent */}
      <div className="bg-zinc-900/70 backdrop-blur-md rounded-2xl p-3.5 border border-white/[0.07] hover:border-white/[0.15] transition-colors flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase">
            Total Lent
          </span>
          <div className="w-5 h-5 rounded-md bg-white/[0.05] text-zinc-300 flex items-center justify-center">
            <ArrowUpRight size={12} />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-white font-['Plus_Jakarta_Sans'] tabular-nums tracking-tight">
            {formatINR(summary.totalLent)}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">
            {summary.counts.total} recorded
          </span>
        </div>
      </div>

      {/* 2. Total Repaid */}
      <div className="bg-zinc-900/70 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-900/40 hover:border-emerald-700/50 transition-colors flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
            Settled
          </span>
          <div className="w-5 h-5 rounded-md bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={12} />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-emerald-300 font-['Plus_Jakarta_Sans'] tabular-nums tracking-tight">
            {formatINR(summary.totalRepaid)}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-medium">
            {summary.counts.repaid} cleared
          </span>
        </div>
      </div>

      {/* 3. Pending Amount */}
      <div className="bg-zinc-900/70 backdrop-blur-md rounded-2xl p-3.5 border border-amber-900/30 hover:border-amber-700/50 transition-colors flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-amber-300 tracking-wider uppercase">
            Pending
          </span>
          <div className="w-5 h-5 rounded-md bg-amber-950/50 text-amber-400 flex items-center justify-center">
            <Clock size={12} />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-amber-200 font-['Plus_Jakarta_Sans'] tabular-nums tracking-tight">
            {formatINR(summary.pendingAmount)}
          </div>
          <span className="text-[10px] text-amber-400/70 font-medium">
            {summary.counts.pending} outstanding
          </span>
        </div>
      </div>

      {/* 4. Overdue Amount */}
      <div className={`backdrop-blur-md rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
        summary.overdueAmount > 0 
          ? 'bg-rose-950/30 border-rose-800/60 shadow-[0_0_20px_-5px_rgba(244,63,94,0.15)]' 
          : 'bg-zinc-900/70 border-white/[0.07]'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[11px] font-bold tracking-wider uppercase ${
            summary.overdueAmount > 0 ? 'text-rose-400' : 'text-zinc-400'
          }`}>
            Overdue
          </span>
          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
            summary.overdueAmount > 0 ? 'bg-rose-950 text-rose-300' : 'bg-white/[0.05] text-zinc-500'
          }`}>
            <AlertTriangle size={12} />
          </div>
        </div>
        <div>
          <div className={`text-lg font-extrabold tabular-nums tracking-tight ${
            summary.overdueAmount > 0 ? 'text-rose-300' : 'text-zinc-400'
          }`}>
            {formatINR(summary.overdueAmount)}
          </div>
          <span className={`text-[10px] font-semibold ${
            summary.overdueAmount > 0 ? 'text-rose-400/90' : 'text-zinc-400'
          }`}>
            {summary.counts.overdue > 0 ? `${summary.counts.overdue} require action` : 'None overdue'}
          </span>
        </div>
      </div>
    </div>
  );
};
