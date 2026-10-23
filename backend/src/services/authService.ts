/**
 * @file services/authService.ts
 * @description Business logic for Mock OTP generation, verification, and JWT authentication.
 */

import jwt from 'jsonwebtoken';
import { getDb } from '../db/index.js';
import { config } from '../config/index.js';
import { addLog } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

export class AuthService {
  /**
   * Generates a 6-digit mock OTP, saves it with an expiration timestamp,
   * and prints it prominently to server terminal logs.
   */
  static async requestOtp(phone: string): Promise<{ message: string; expiresInSeconds: number; debugOtp?: string }> {
    const db = await getDb();

    // Generate random 6-digit OTP code (between 100000 and 999999)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set 5-minute expiry
    const expiresAt = new Date(Date.now() + config.otp.expiresInMinutes * 60 * 1000);

    // Save or upsert OTP in PostgreSQL
    await db.query(`
      INSERT INTO otps (phone, otp_code, expires_at, attempts)
      VALUES ($1, $2, $3, 0)
      ON CONFLICT (phone) DO UPDATE 
      SET otp_code = $2, expires_at = $3, attempts = 0, created_at = CURRENT_TIMESTAMP
    `, [phone, otpCode, expiresAt.toISOString()]);

    // Print to server terminal / console as requested by prompt
    addLog('otp', `Generated OTP for Indian mobile: +91 ${phone}`, {
      phone,
      otp: otpCode,
      expiresAt: expiresAt.toISOString(),
      validity: `${config.otp.expiresInMinutes} minutes`,
    });

    const maskedPhone = phone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2');

    return {
      message: `Mock OTP generated and printed to server logs for +91 ${maskedPhone}`,
      expiresInSeconds: config.otp.expiresInMinutes * 60,
      // Provide in development response for easy testing / zero frustration
      debugOtp: config.isProduction ? undefined : otpCode,
    };
  }

  /**
   * Verifies the submitted OTP against the database record.
   * On success, creates or retrieves user account and issues JWT.
   */
  static async verifyOtp(phone: string, submittedOtp: string): Promise<{ token: string; user: { id: string; phone: string; name?: string } }> {
    const db = await getDb();

    // Query OTP record
    const otpResult = await db.query(
      `SELECT phone, otp_code, expires_at, attempts FROM otps WHERE phone = $1`,
      [phone]
    );

    if (otpResult.rows.length === 0) {
      throw new AppError('No active OTP found for this number. Please request an OTP first.', 400, 'OTP_NOT_FOUND');
    }

    const record = otpResult.rows[0] as {
      phone: string;
      otp_code: string;
      expires_at: string;
      attempts: number;
    };

    // Check rate limit / max attempts
    if (record.attempts >= config.otp.maxAttempts) {
      throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', 429, 'MAX_ATTEMPTS_EXCEEDED');
    }

    // Check expiration
    const now = new Date();
    const expiryTime = new Date(record.expires_at);
    if (now > expiryTime) {
      throw new AppError('This OTP has expired. Please request a new OTP.', 400, 'OTP_EXPIRED');
    }

    // Verify OTP match
    if (record.otp_code !== submittedOtp.trim()) {
      const remainingAttempts = config.otp.maxAttempts - (record.attempts + 1);
      
      // Increment attempt counter
      await db.query(
        `UPDATE otps SET attempts = attempts + 1 WHERE phone = $1`,
        [phone]
      );

      addLog('warn', `Failed OTP attempt for +91 ${phone}. Remaining attempts: ${remainingAttempts}`);

      throw new AppError(
        `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`,
        400,
        'INVALID_OTP'
      );
    }

    // OTP is valid! Remove OTP record to prevent reuse
    await db.query(`DELETE FROM otps WHERE phone = $1`, [phone]);

    // Check if user exists or create new user
    let userResult = await db.query(`SELECT id, phone, name FROM users WHERE phone = $1`, [phone]);
    let user: { id: string; phone: string; name?: string };

    if (userResult.rows.length === 0) {
      // Create new user with unique ID
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const defaultName = `User ${phone.slice(-4)}`;
      
      await db.query(
        `INSERT INTO users (id, phone, name) VALUES ($1, $2, $3)`,
        [newUserId, phone, defaultName]
      );

      user = { id: newUserId, phone, name: defaultName };
      addLog('info', `Created new user account for +91 ${phone} (${newUserId})`);
    } else {
      user = userResult.rows[0] as { id: string; phone: string; name?: string };
      addLog('info', `User logged in: +91 ${phone} (${user.id})`);
    }

    // Issue JWT token signed with secret
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user,
    };
  }
}
