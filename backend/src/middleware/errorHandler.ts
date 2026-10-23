/**
 * @file middleware/errorHandler.ts
 * @description Centralized error handling and request validation helpers.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { addLog } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Higher-order middleware to validate incoming request body against a Zod schema.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: issues[0]?.message || 'Invalid input data',
            details: issues,
          },
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Global Express error handling middleware.
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected server error occurred';

  addLog('error', `[${req.method} ${req.path}] ${message}`, {
    statusCode,
    code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
