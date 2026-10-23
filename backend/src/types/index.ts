/**
 * @file types/index.ts
 * @description Core TypeScript types and interfaces for the MiniLedger backend.
 */

export interface User {
  id: string;
  phone: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export type LoanStatus = 'pending' | 'repaid';

export interface Loan {
  id: string;
  user_id: string;
  friend_name: string;
  amount: number; // In INR; formatted from NUMERIC(12,2)
  lent_date: string; // ISO date string YYYY-MM-DD
  due_date: string; // ISO date string YYYY-MM-DD
  status: LoanStatus;
  notes?: string | null;
  receipt_url?: string | null;
  repaid_at?: string | null;
  created_at: string;
  updated_at: string;
  // Computed property
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

export interface JwtPayload {
  userId: string;
  phone: string;
}

export interface OtpRecord {
  phone: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}
