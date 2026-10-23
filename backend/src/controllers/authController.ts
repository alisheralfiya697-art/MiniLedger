/**
 * @file controllers/authController.ts
 * @description HTTP request handlers for phone number and OTP authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';

export class AuthController {
  /**
   * POST /api/auth/request-otp
   * Generates a 6-digit mock OTP, prints it to server logs, and stores it with expiry.
   */
  static async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.body;
      const result = await AuthService.requestOtp(phone);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          phone,
          expiresInSeconds: result.expiresInSeconds,
          debugOtp: result.debugOtp, // Included in non-prod for smooth interviewer testing
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-otp
   * Validates OTP code, logs the user in, and returns a signed JWT token.
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, otp } = req.body;
      const result = await AuthService.verifyOtp(phone, otp);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user profile.
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }
}
