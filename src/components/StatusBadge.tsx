/**
 * @file src/components/StatusBadge.tsx
 * @description Luxury status indicator badge with subtle hairline finishes.
 */

import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'repaid';
  isOverdue?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isOverdue = false, size = 'md' }) => {
  const isSmall = size === 'sm';
  const padding = isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const iconSize = isSmall ? 11 : 13;

  if (status === 'repaid') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold tracking-wide rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 backdrop-blur-xs ${padding}`}>
        <CheckCircle2 size={iconSize} className="text-emerald-400" />
        SETTLED
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold tracking-wide rounded-full bg-rose-950/50 text-rose-300 border border-rose-800/60 shadow-[0_0_12px_-2px_rgba(244,63,94,0.3)] animate-pulse ${padding}`}>
        <AlertCircle size={iconSize} className="text-rose-400" />
        OVERDUE
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium tracking-wide rounded-full bg-amber-950/30 text-amber-300 border border-amber-800/40 backdrop-blur-xs ${padding}`}>
      <Clock size={iconSize} className="text-amber-400" />
      PENDING
    </span>
  );
};
