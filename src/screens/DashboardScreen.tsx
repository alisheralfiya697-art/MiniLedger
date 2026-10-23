/**
 * @file src/screens/DashboardScreen.tsx
 * @description Screen 2: Luxury MiniLedger Dashboard with Centurion metal card visual,
 * summary metrics, search filters, and overdue indicators in red.
 */

import React, { useState, useEffect } from 'react';
import { Loan, FinancialSummary, User } from '../types';
import { api, storage } from '../services/api';
import { SummaryCards } from '../components/SummaryCards';
import { LoanCard } from '../components/LoanCard';
import { formatINR } from '../utils/formatters';
import { 
  Plus, 
  RefreshCw, 
  Search, 
  LogOut, 
  Terminal, 
  Inbox, 
  AlertCircle,
  CreditCard,
  Wifi
} from 'lucide-react';

interface DashboardScreenProps {
  user: User;
  onLogout: () => void;
  onNavigateAddLoan: () => void;
  onNavigateLoanDetails: (loanId: string) => void;
  onOpenTerminal: () => void;
}

type FilterTab = 'all' | 'pending' | 'overdue' | 'repaid';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  onLogout,
  onNavigateAddLoan,
  onNavigateLoanDetails,
  onOpenTerminal,
}) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (isPullToRefresh = false) => {
    if (isPullToRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [loansData, summaryData] = await Promise.all([
        api.getLoans(),
        api.getSummary(),
      ]);
      setLoans(loansData);
      setSummary(summaryData);
    } catch (err: any) {
      if (err.status === 401) {
        storage.clearToken();
        onLogout();
        return;
      }
      setError(err.message || 'Failed to load ledger records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and search logic
  const filteredLoans = loans.filter((loan) => {
    if (activeTab === 'pending' && loan.status !== 'pending') return false;
    if (activeTab === 'repaid' && loan.status !== 'repaid') return false;
    if (activeTab === 'overdue' && !loan.is_overdue) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = loan.friend_name.toLowerCase().includes(query);
      const matchNotes = loan.notes?.toLowerCase().includes(query);
      const matchAmount = loan.amount.toString().includes(query);
      return matchName || matchNotes || matchAmount;
    }

    return true;
  });

  return (
    <div className="min-h-full flex flex-col bg-[#0b0d12] text-zinc-100 select-none">
      {/* App Header */}
      <header className="sticky top-0 z-30 bg-[#0b0d12]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-sm">
            <div className="w-full h-full rounded-lg bg-zinc-950 flex items-center justify-center font-['Playfair_Display'] font-black text-amber-300 text-xs">
              ML
            </div>
          </div>
          <div>
            <h1 className="font-['Playfair_Display'] font-bold text-white text-base leading-none tracking-wide">
              MiniLedger
            </h1>
            <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
              +91 {user.phone}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-amber-400' : ''} />
          </button>

          <button
            onClick={onOpenTerminal}
            title="Server Logs Terminal"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            <Terminal size={15} className="text-amber-400" />
          </button>

          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData()}
              className="font-bold underline text-rose-300 hover:text-white ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Ultra-Luxury Metal Ledger Card */}
        <div className="relative mb-4 rounded-3xl p-5 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-white/[0.12] shadow-2xl overflow-hidden group">
          {/* Subtle metallic diagonal sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/[0.04] via-white/[0.05] to-transparent pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-amber-500/[0.08] blur-2xl pointer-events-none" />

          {/* Card Top Row: EMV Chip + Contactless icon */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              {/* EMV Chip graphic */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 p-[1px] shadow-sm">
                <div className="w-full h-full rounded-md bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 flex flex-col justify-between p-1 opacity-90">
                  <div className="h-[1px] w-full bg-amber-600/60" />
                  <div className="h-[1px] w-2/3 bg-amber-600/60" />
                  <div className="h-[1px] w-full bg-amber-600/60" />
                </div>
              </div>
              <Wifi size={16} className="text-zinc-500 rotate-90" />
            </div>

            <span className="font-['Playfair_Display'] italic text-[11px] font-bold tracking-widest text-amber-200/90 uppercase">
              Private Ledger
            </span>
          </div>

          {/* Card Middle: Principal Balance */}
          <div className="mb-4 relative z-10">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">
              Total Active Portfolio
            </span>
            <div className="font-['Playfair_Display'] text-3xl font-bold tracking-tight text-white tabular-nums">
              {summary ? formatINR(summary.pendingAmount, true) : '₹0.00'}
            </div>
          </div>

          {/* Card Bottom: User Masked Account & Status */}
          <div className="flex items-center justify-between text-xs relative z-10 pt-2 border-t border-white/[0.07]">
            <span className="font-mono text-zinc-400 tracking-widest text-[11px]">
              •••• {user.phone.slice(-4)}
            </span>
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] tracking-wider uppercase font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <span>{summary ? `${summary.counts.pending} Active Loans` : 'Synchronized'}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Financial Summary Cards */}
        <SummaryCards summary={summary} loading={loading && !refreshing} />

        {/* Section 2: Search Bar & Segmented Filters */}
        <div className="space-y-2.5 mb-4">
          {/* Search box */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search recipient, amount, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-xs font-medium text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/80 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {([
              { key: 'all' as FilterTab, label: 'All Records', count: summary?.counts.total, isOverdueAlert: false },
              { key: 'pending' as FilterTab, label: 'Pending', count: summary?.counts.pending, isOverdueAlert: false },
              { key: 'overdue' as FilterTab, label: 'Overdue', count: summary?.counts.overdue, isOverdueAlert: true },
              { key: 'repaid' as FilterTab, label: 'Settled', count: summary?.counts.repaid, isOverdueAlert: false },
            ]).map((tab) => {
              const isActive = activeTab === tab.key;
              const hasAlert = tab.isOverdueAlert && (summary?.counts.overdue || 0) > 0;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? hasAlert
                        ? 'bg-rose-900 text-rose-200 border border-rose-700 shadow-sm'
                        : 'bg-amber-400 text-zinc-950 shadow-sm'
                      : hasAlert
                      ? 'bg-rose-950/40 text-rose-300 border border-rose-900/60 hover:bg-rose-950/60'
                      : 'bg-zinc-900/40 text-zinc-400 border border-white/[0.05] hover:bg-zinc-900/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                      isActive 
                        ? 'bg-black/20 text-current' 
                        : hasAlert 
                        ? 'bg-rose-900/60 text-rose-300' 
                        : 'bg-white/[0.06] text-zinc-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Loan Entries List */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              Transactions ({filteredLoans.length})
            </h3>
            <span className="text-[10px] text-zinc-400 font-medium">
              Sorted by due date
            </span>
          </div>

          {loading && !refreshing ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-zinc-900/40 border border-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="bg-zinc-900/30 rounded-3xl p-8 border border-dashed border-white/[0.08] text-center my-4 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-zinc-500 flex items-center justify-center mb-3">
                <Inbox size={24} />
              </div>
              <h4 className="font-['Playfair_Display'] font-bold text-zinc-200 text-base mb-1">
                {searchQuery
                  ? 'No matching ledger entries'
                  : activeTab === 'overdue'
                  ? 'All repayments on track'
                  : activeTab === 'pending'
                  ? 'No outstanding balances'
                  : activeTab === 'repaid'
                  ? 'No settled loans recorded'
                  : 'Ledger is clear'}
              </h4>
              <p className="text-xs text-zinc-400 max-w-xs mb-4">
                {searchQuery
                  ? 'Try searching with a different name or amount.'
                  : 'Record money lent to friends, establish agreed dates, and track settlements.'}
              </p>
              {!searchQuery && activeTab === 'all' && (
                <button
                  onClick={onNavigateAddLoan}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  Record First Loan
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onClick={() => onNavigateLoanDetails(loan.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button / "+ Add Loan" */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <button
          onClick={onNavigateAddLoan}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-bold text-sm tracking-wide shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus size={16} />
          Record New Loan
        </button>
      </div>
    </div>
  );
};
