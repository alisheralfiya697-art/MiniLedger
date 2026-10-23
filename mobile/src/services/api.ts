/**
 * @file mobile/src/services/api.ts
 * @description Centralized Axios API service with environment-aware dynamic BASE_URL resolution.
 * Automatically switches between:
 * - Local computer LAN IP for Physical Devices (via Expo Host URI or NativeModules scriptURL)
 * - 10.0.2.2 for Android Emulators (loopback alias to host machine)
 * - localhost for iOS Simulators and Web
 * - EXPO_PUBLIC_API_URL environment variable override (if configured)
 */

import axios from 'axios';
import { Platform, NativeModules } from 'react-native';

/**
 * Extracts the host IP from the development bundle script URL.
 * When running in Expo on a physical device, the bundle is served from the developer's computer IP (e.g. 192.168.1.15).
 */
function getDevServerHost(): string | null {
  try {
    // 1. Try React Native NativeModules.SourceCode (standard in all RN versions)
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch {
    // Fallback if NativeModules is unavailable
  }

  try {
    // 2. Try Expo Constants dynamically if expo-constants is linked
    const Constants = require('expo-constants').default;
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoGo?.debuggerHost || Constants?.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch {
    // expo-constants not present or not running in Expo Go
  }

  return null;
}

/**
 * Checks whether the app is executing on a physical device or an emulator.
 */
function checkIsPhysicalDevice(): boolean {
  try {
    const Device = require('expo-device');
    if (Device && typeof Device.isDevice === 'boolean') {
      return Device.isDevice;
    }
  } catch {
    // expo-device not loaded
  }

  // Heuristic: If we extracted a private LAN IP (192.168.x.x, 10.x.x.x, 172.x.x.x), it's likely a physical device
  const host = getDevServerHost();
  if (host && (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.'))) {
    return true;
  }

  return false;
}

/**
 * Resolves the appropriate API base URL based on runtime platform and device type.
 */
export function resolveApiBaseUrl(port: number = 3000): string {
  // 1. Explicit Environment Variable Override (e.g., from .env or Expo EAS build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const isPhysicalDevice = checkIsPhysicalDevice();
  const lanHost = getDevServerHost();

  // 2. Physical Device Scenario:
  // Must use developer computer's actual LAN IP on the same Wi-Fi network.
  if (isPhysicalDevice && lanHost) {
    const url = `http://${lanHost}:${port}/api`;
    console.log(`[MiniLedger API] Physical Device detected. Using LAN Base URL: ${url}`);
    return url;
  }

  // 3. Emulator / Simulator Scenario:
  if (Platform.OS === 'android') {
    // Android emulator cannot reach 'localhost' directly (refers to the Android VM itself).
    // The standard Android SDK emulator maps 10.0.2.2 to the host development machine's 127.0.0.1.
    const url = `http://10.0.2.2:${port}/api`;
    console.log(`[MiniLedger API] Android Emulator detected. Using Loopback Base URL: ${url}`);
    return url;
  }

  if (Platform.OS === 'ios') {
    // iOS Simulator shares the host network interface, so localhost works directly.
    const url = `http://localhost:${port}/api`;
    console.log(`[MiniLedger API] iOS Simulator detected. Using Localhost Base URL: ${url}`);
    return url;
  }

  // 4. Web browser or fallback default
  if (typeof window !== 'undefined' && window.location) {
    return '/api';
  }

  return `http://localhost:${port}/api`;
}

// Initial resolved base URL
export const BASE_URL = resolveApiBaseUrl(3000);

// Axios instance configured with environment-aware BASE_URL
const apiClient = axios.create({
  baseURL: BASE_URL,
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

/**
 * Allows dynamically changing the API URL at runtime (e.g. from developer settings)
 */
export const updateApiBaseUrl = (newBaseUrl: string) => {
  apiClient.defaults.baseURL = newBaseUrl;
  console.log(`[MiniLedger API] Updated API Base URL to: ${newBaseUrl}`);
};

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
