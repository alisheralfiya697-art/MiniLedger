/**
 * @file validators/index.ts
 * @description Zod validation schemas for API requests.
 * Enforces Indian phone formatting, 6-digit OTPs, positive monetary amounts,
 * and valid dates.
 */

import { z } from 'zod';

/**
 * Normalizes an Indian phone number string to 10 digits.
 * Accepts formats like:
 * - "9876543210"
 * - "+919876543210"
 * - "+91 98765 43210"
 * - "09876543210"
 */
export function normalizeIndianPhone(input: string): string {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');
  
  // If 12 digits starting with 91 (e.g. 919876543210), strip the 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.substring(2);
  }
  // If 11 digits starting with 0, strip leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.substring(1);
  }
  return digits;
}

// Phone validator regex: 10 digits starting with 6, 7, 8, or 9
const indianPhoneRegex = /^[6-9]\d{9}$/;

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .transform(normalizeIndianPhone)
    .refine((val) => indianPhoneRegex.test(val), {
      message: 'Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9)',
    }),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .transform(normalizeIndianPhone)
    .refine((val) => indianPhoneRegex.test(val), {
      message: 'Please enter a valid 10-digit Indian mobile number',
    }),
  otp: z
    .string()
    .regex(/^\d{6}$/, { message: 'OTP must be exactly 6 numeric digits' }),
});

export const createLoanSchema = z.object({
  friend_name: z
    .string()
    .trim()
    .min(2, { message: 'Friend name must be at least 2 characters' })
    .max(100, { message: 'Friend name cannot exceed 100 characters' }),
  amount: z
    .coerce
    .number()
    .positive({ message: 'Loan amount must be greater than zero' })
    .max(10000000, { message: 'Loan amount exceeds maximum allowed limit (₹1,00,00,000)' }),
  lent_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Lent date must be in YYYY-MM-DD format' }),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Due date must be in YYYY-MM-DD format' }),
  notes: z
    .string()
    .max(1000, { message: 'Notes cannot exceed 1000 characters' })
    .optional()
    .nullable(),
  receipt_url: z
    .string()
    .optional()
    .nullable(),
}).refine((data) => {
  // Validate that due_date is not earlier than lent_date
  return new Date(data.due_date) >= new Date(data.lent_date);
}, {
  message: 'Due date cannot be earlier than the date the money was lent',
  path: ['due_date'],
});

export const loanIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Loan ID parameter is required' }),
});
