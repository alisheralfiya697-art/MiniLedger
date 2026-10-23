/**
 * @file mobile/src/services/api.ts
 * @description Centralized Axios API service with JWT authorization header interceptor.
 */

import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2; for iOS simulator/web use localhost; for physical phone use LAN IP.
export const DEFAULT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = () => authToken;

export const api = {
  // Auth
  requestOtp: (phone: string) => apiClient.post('/auth/request-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => apiClient.post('/auth/verify-otp', { phone, otp }),
  getProfile: () => apiClient.get('/auth/me'),

  // Loans
  getLoans: (status?: string) => apiClient.get('/loans', { params: status ? { status } : {} }),
  getLoanById: (id: string) => apiClient.get(`/loans/${id}`),
  createLoan: (data: {
    friend_name: string;
    amount: number;
    lent_date: string;
    due_date: string;
    notes?: string | null;
    receipt_url?: string | null;
  }) => apiClient.post('/loans', data),
  markAsRepaid: (id: string) => apiClient.patch(`/loans/${id}/repay`),
  deleteLoan: (id: string) => apiClient.delete(`/loans/${id}`),

  // Summary
  getSummary: () => apiClient.get('/summary'),
};

export default apiClient;
