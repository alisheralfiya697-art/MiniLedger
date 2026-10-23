/**
 * @file controllers/summaryController.ts
 * @description HTTP request handler for financial metrics and summary calculations.
 */

import { Request, Response, NextFunction } from 'express';
import { LoanService } from '../services/loanService.js';

export class SummaryController {
  /**
   * GET /api/summary
   * Returns authenticated user's financial overview:
   * totalLent, totalRepaid, pendingAmount, overdueAmount
   */
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await LoanService.getSummary(userId);

      res.status(200).json({
        success: true,
        data: {
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
