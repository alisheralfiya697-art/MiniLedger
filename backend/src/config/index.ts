/**
 * @file config/index.ts
 * @description Centralized application configuration.
 * All environment variables are validated and defaulted here.
 */

export const config = {
  // Server Port (defaults to 3000 as per environment constraints)
  port: parseInt(process.env.PORT && process.env.PORT !== '8080' ? process.env.PORT : '3000', 10),
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'miniledger-super-secure-dev-secret-key-2026',
    expiresIn: '7d', // Tokens valid for 7 days
  },

  // Mock OTP Configuration
  otp: {
    length: 6,
    expiresInMinutes: 5,
    maxAttempts: 3, // Lock out after 3 failed verification attempts
  },

  // Environment
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};
