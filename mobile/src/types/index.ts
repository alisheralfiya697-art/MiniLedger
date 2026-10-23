/**
 * @file mobile/src/types/index.ts
 * @description Type definitions for the MiniLedger React Native Expo application.
 */

export interface User {
  id: string;
  phone: string;
  name?: string;
}

export type LoanStatus = 'pending' | 'repaid';

export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  amount: number;
  lent_date: string;
  due_date: string;
  status: LoanStatus;
  notes?: string | null;
  receipt_url?: string | null;
  repaid_at?: string | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
}

export interface FinancialSummary {
  totalLent: number;
  totalRepaid: number;
  pendingAmount: number;
  overdueAmount: number;
  currency: string;
  counts: {
    total: number;
    pending: number;
    repaid: number;
    overdue: number;
  };
}

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AddLoan: undefined;
  LoanDetails: { loanId: string };
};
