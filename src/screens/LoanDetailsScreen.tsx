/**
 * @file src/screens/LoanDetailsScreen.tsx
 * @description Screen 4: Luxury Loan Details screen with archival receipt view,
 * full-screen modal zoom, and settlement confirmation.
 */

import React, { useState, useEffect } from 'react';
import { Loan } from '../types';
import { api } from '../services/api';
import { formatINR, formatDate, getRelativeDueDateInfo } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Trash2, 
  Share2, 
  Check, 
  AlertTriangle, 
  ZoomIn,
  X,
  RefreshCw,
  Copy
} from 'lucide-react';

interface LoanDetailsScreenProps {
  loanId: string;
  onBack: () => void;
  onLoanUpdated: () => void;
}

export const LoanDetailsScreen: React.FC<LoanDetailsScreenProps> = ({
  loanId,
  onBack,
  onLoanUpdated,
}) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmRepay, setShowConfirmRepay] = useState(false);
  const [showZoomImage, setShowZoomImage] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);

  const fetchLoan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLoanById(loanId);
      setLoan(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [loanId]);

  const handleMarkAsRepaid = async () => {
    setActionLoading(true);
    try {
      const updated = await api.markAsRepaid(loanId);
      setLoan(updated);
      setShowConfirmRepay(false);
      onLoanUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to mark loan as repaid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this ledger record?')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.deleteLoan(loanId);
      onLoanUpdated();
      onBack();
    } catch (err: any) {
      setError(err.message || 'Failed to delete record');
      setActionLoading(false);
    }
  };

  const handleCopyReminder = () => {
    if (!loan) return;
    const reminderText = `Hi ${loan.friend_name}, hope you are doing well! Just a gentle note regarding the ${formatINR(loan.amount)} transferred on ${formatDate(loan.lent_date)}, due on ${formatDate(loan.due_date)}. Please let me know when convenient to settle. Warm regards.`;
    navigator.clipboard.writeText(reminderText);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-full flex flex-col bg-[#0b0d12]">
        <header className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded-xl text-zinc-400">
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-32 bg-zinc-800 rounded-sm animate-pulse" />
        </header>
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-28 bg-zinc-900 rounded-3xl" />
          <div className="h-44 bg-zinc-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#0b0d12] text-center">
        <p className="text-xs font-semibold text-rose-400 mb-4">{error || 'Ledger entry not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const relativeInfo = getRelativeDueDateInfo(loan.due_date, loan.status);
  const isOverdue = loan.is_overdue || relativeInfo.isOverdue;

  return (
    <div className="min-h-full flex flex-col bg-[#0b0d12] text-zinc-100 select-none">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0b0d12]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-['Playfair_Display'] font-bold text-white text-base tracking-wide">
            Record Statement
          </h2>
        </div>

        <button
          onClick={handleDelete}
          disabled={actionLoading}
          title="Delete Record"
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
        >
          <Trash2 size={15} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {/* Status Callout Banner */}
        {isOverdue && loan.status === 'pending' && (
          <div className="p-4 rounded-3xl bg-rose-950/40 border border-rose-800/60 text-rose-200 flex items-start gap-3 shadow-[0_0_20px_-5px_rgba(244,63,94,0.15)]">
            <div className="w-8 h-8 rounded-full bg-rose-900/60 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-rose-300">
                Payment is {relativeInfo.text}
              </h4>
              <p className="text-[11px] text-rose-400/90 mt-0.5 leading-relaxed">
                The agreed deadline of {formatDate(loan.due_date)} has passed. Consider sharing a reminder note.
              </p>
            </div>
          </div>
        )}

        {loan.status === 'repaid' && (
          <div className="p-4 rounded-3xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-emerald-300">
                Loan Fully Settled & Cleared
              </h4>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Settlement recorded on {loan.repaid_at ? formatDate(loan.repaid_at) : 'recently'}.
              </p>
            </div>
          </div>
        )}

        {/* Hero Card: Friend + Rupee Amount */}
        <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl p-6 border border-white/[0.08] shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.04] rounded-full blur-2xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center font-bold text-base bg-zinc-800 border border-white/[0.1] text-amber-200">
            {loan.friend_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <h3 className="font-['Playfair_Display'] font-bold text-xl text-white tracking-wide">
            {loan.friend_name}
          </h3>
          <div className="my-2.5">
            <StatusBadge status={loan.status} isOverdue={isOverdue} size="md" />
          </div>
          <div className={`font-['Playfair_Display'] text-3xl font-bold mt-2 tracking-tight tabular-nums ${
            isOverdue ? 'text-rose-300' : loan.status === 'repaid' ? 'text-emerald-400' : 'text-white'
          }`}>
            {formatINR(loan.amount, true)}
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase block mt-1">
            Indian Rupee • Exact NUMERIC Precision
          </span>
        </div>

        {/* Transaction Details Grid */}
        <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl p-5 border border-white/[0.08] space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Ledger Metadata
          </h4>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block mb-1 text-[11px]">Lent Date</span>
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Calendar size={13} className="text-zinc-400" />
                {formatDate(loan.lent_date)}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 block mb-1 text-[11px]">Agreed Due Date</span>
              <span className={`font-semibold flex items-center gap-1.5 ${isOverdue ? 'text-rose-400' : 'text-zinc-200'}`}>
                <Clock size={13} className={isOverdue ? 'text-rose-400' : 'text-zinc-400'} />
                {formatDate(loan.due_date)}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 block mb-1 text-[11px]">Current Status</span>
              <span className="font-semibold text-zinc-200 capitalize">
                {loan.status} {isOverdue && '(Overdue)'}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 block mb-1 text-[11px]">Unique Identifier</span>
              <span className="font-mono text-[10px] text-zinc-400 truncate block">
                {loan.id}
              </span>
            </div>
          </div>

          {/* Notes */}
          {loan.notes && (
            <div className="pt-3 border-t border-white/[0.06]">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                Agreement Notes
              </span>
              <p className="text-xs text-zinc-300 bg-white/[0.03] p-3 rounded-2xl leading-relaxed border border-white/[0.05]">
                {loan.notes}
              </p>
            </div>
          )}

          {/* Receipt Archive Preview */}
          {loan.receipt_url && (
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Archived Receipt Slip
                </span>
                <span className="text-[10px] text-amber-300/80 font-medium flex items-center gap-1">
                  <ZoomIn size={11} /> Tap to expand
                </span>
              </div>
              <div 
                onClick={() => setShowZoomImage(true)}
                className="relative rounded-2xl overflow-hidden border border-white/[0.1] cursor-pointer group bg-zinc-950"
              >
                <img 
                  src={loan.receipt_url} 
                  alt="Receipt" 
                  className="w-full h-36 object-cover group-hover:scale-105 transition duration-300" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-semibold gap-1.5">
                  <ZoomIn size={14} /> Full View
                </div>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Reminder Helper */}
        {loan.status === 'pending' && (
          <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl p-4 border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center">
                <Share2 size={15} />
              </div>
              <div>
                <h5 className="font-bold text-xs text-zinc-100">Polite Reminder Note</h5>
                <p className="text-[10px] text-zinc-400">Copy bespoke reminder text</p>
              </div>
            </div>

            <button
              onClick={handleCopyReminder}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 border border-white/[0.06]"
            >
              {copiedReminder ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action: Settle Loan */}
      {loan.status === 'pending' && (
        <div className="p-4 border-t border-white/[0.06] bg-[#0b0d12]">
          <button
            onClick={() => setShowConfirmRepay(true)}
            disabled={actionLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 font-bold text-sm tracking-wide shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
          >
            <CheckCircle2 size={16} />
            Settle & Mark as Repaid
          </button>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {showConfirmRepay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-white/[0.15] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-white mb-1">
              Confirm Settlement
            </h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Confirm that <strong className="text-white">{loan.friend_name}</strong> has returned the full balance of <strong className="text-amber-300 font-mono">{formatINR(loan.amount)}</strong>.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmRepay(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-zinc-300 text-xs font-semibold hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsRepaid}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Settled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Receipt Image Modal */}
      {showZoomImage && loan.receipt_url && (
        <div 
          onClick={() => setShowZoomImage(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <button 
            onClick={() => setShowZoomImage(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          <img 
            src={loan.receipt_url} 
            alt="Receipt Document Full View" 
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/[0.1]" 
          />
        </div>
      )}
    </div>
  );
};
