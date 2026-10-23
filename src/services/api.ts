/**
 * @file src/services/api.ts
 * @description Frontend API client interfacing with Express backend.
 */

import { Loan, FinancialSummary, User, ServerLog } from '../types';

const TOKEN_KEY = 'miniledger_auth_token';
const USER_KEY = 'miniledger_user_profile';

export const storage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
};

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMessage) as any;
    err.code = data?.error?.code;
    err.status = response.status;
    err.details = data?.error?.details;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  async requestOtp(phone: string): Promise<{ phone: string; expiresInSeconds: number; debugOtp?: string }> {
    const res = await fetchWithAuth('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return res.data;
  },

  async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: User }> {
    const res = await fetchWithAuth('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
    storage.setToken(res.data.token);
    storage.setUser(res.data.user);
    return res.data;
  },

  async getProfile(): Promise<User> {
    const res = await fetchWithAuth('/api/auth/me');
    return res.data.user;
  },

  // Loans
  async getLoans(status?: string): Promise<Loan[]> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetchWithAuth(`/api/loans${query}`);
    return res.data.loans;
  },

  async getLoanById(id: string): Promise<Loan> {
    const res = await fetchWithAuth(`/api/loans/${id}`);
    return res.data.loan;
  },

  async createLoan(loanData: {
    friend_name: string;
    amount: number;
    lent_date: string;
    due_date: string;
    notes?: string | null;
    receipt_url?: string | null;
  }): Promise<Loan> {
    const res = await fetchWithAuth('/api/loans', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
    return res.data.loan;
  },

  async markAsRepaid(id: string): Promise<Loan> {
    const res = await fetchWithAuth(`/api/loans/${id}/repay`, {
      method: 'PATCH',
    });
    return res.data.loan;
  },

  async deleteLoan(id: string): Promise<void> {
    await fetchWithAuth(`/api/loans/${id}`, {
      method: 'DELETE',
    });
  },

  // Summary
  async getSummary(): Promise<FinancialSummary> {
    const res = await fetchWithAuth('/api/summary');
    return res.data.summary;
  },

  // Developer Logs & Diagnostics
  async getRecentLogs(): Promise<ServerLog[]> {
    const res = await fetch('/api/logs').then((r) => r.json());
    return res?.data?.logs || [];
  },

  async resetDemoData(): Promise<void> {
    await fetch('/api/dev/reset-demo', { method: 'POST' });
  },
};
