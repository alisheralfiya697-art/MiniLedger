/**
 * @file middleware/auth.ts
 * @description JWT authentication middleware.
 * Verifies Bearer tokens and ensures loans are strictly scoped to the requesting user.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JwtPayload } from '../types/index.js';

// Extend Express Request interface to include decoded user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required. Please log in with your phone number and OTP.',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    if (!decoded.userId || !decoded.phone) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_PAYLOAD',
          message: 'Malformed authentication token.',
        },
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    res.status(401).json({
      success: false,
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired ? 'Your session has expired. Please log in again.' : 'Invalid or corrupt token.',
      },
    });
  }
}
