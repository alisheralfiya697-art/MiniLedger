/**
 * @file src/components/LoanCard.tsx
 * @description Luxury loan record card with hairline borders, avatar monograms, and overdue alerting.
 */

import React from 'react';
import { Loan } from '../types';
import { formatINR, formatDate, getRelativeDueDateInfo } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { Calendar, Paperclip, ChevronRight } from 'lucide-react';

interface LoanCardProps {
  loan: Loan;
  onClick: () => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({ loan, onClick }) => {
  const relativeInfo = getRelativeDueDateInfo(loan.due_date, loan.status);
  const isOverdue = loan.is_overdue || relativeInfo.isOverdue;

  // Generate consistent friendly avatar initials
  const initials = loan.friend_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative w-full rounded-2xl p-4 transition-all duration-200 cursor-pointer text-left border ${
        isOverdue
          ? 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-800/60 shadow-[0_4px_20px_-8px_rgba(244,63,94,0.2)]'
          : loan.status === 'repaid'
          ? 'bg-zinc-900/40 hover:bg-zinc-900/60 border-white/[0.05] hover:border-white/[0.1]'
          : 'bg-zinc-900/60 hover:bg-zinc-900/80 border-white/[0.07] hover:border-white/[0.15] shadow-xs'
      }`}
    >
      {/* Top row: Friend Monogram + Name + Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider shrink-0 border ${
            isOverdue
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : loan.status === 'repaid'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              : 'bg-zinc-800 border-zinc-700 text-zinc-200'
          }`}>
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-zinc-100 text-sm leading-tight truncate group-hover:text-amber-200 transition-colors">
              {loan.friend_name}
            </h4>
            <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
              <Calendar size={11} className="text-zinc-400" /> Lent {formatDate(loan.lent_date)}
            </span>
          </div>
        </div>

        <StatusBadge status={loan.status} isOverdue={isOverdue} size="sm" />
      </div>

      {/* Middle row: Rupee Amount + Due date / Relative days */}
      <div className="flex items-end justify-between pt-2.5 border-t border-white/[0.05]">
        <div>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
            {loan.status === 'repaid' ? 'Settled Amount' : 'Outstanding Balance'}
          </span>
          <div className={`text-xl font-bold font-['Plus_Jakarta_Sans'] tabular-nums tracking-tight ${
            isOverdue
              ? 'text-rose-300 font-extrabold'
              : loan.status === 'repaid'
              ? 'text-emerald-400 line-through opacity-70'
              : 'text-white'
          }`}>
            {formatINR(loan.amount)}
          </div>
        </div>

        <div className="text-right flex items-center gap-2">
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
              Due Date
            </span>
            <div className={`text-xs font-semibold tabular-nums ${
              isOverdue ? 'text-rose-400 font-bold' : 'text-zinc-200'
            }`}>
              {formatDate(loan.due_date)}
            </div>
            {loan.status === 'pending' && (
              <span className={`text-[10px] font-medium block ${isOverdue ? 'text-rose-400 font-semibold' : 'text-zinc-400'}`}>
                {relativeInfo.text}
              </span>
            )}
          </div>

          <div className="w-6 h-6 rounded-lg bg-white/[0.04] text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/[0.08] flex items-center justify-center shrink-0 transition">
            <ChevronRight size={13} />
          </div>
        </div>
      </div>

      {/* Optional attachments/notes badge */}
      {(loan.receipt_url || loan.notes) && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center gap-3 text-xs text-zinc-400">
          {loan.receipt_url && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300/80">
              <Paperclip size={10} className="text-amber-400" /> Receipt Archive
            </span>
          )}
          {loan.notes && (
            <span className="truncate text-[10px] text-zinc-400 italic max-w-[200px]">
              &ldquo;{loan.notes}&rdquo;
            </span>
          )}
        </div>
      )}
    </div>
  );
};
