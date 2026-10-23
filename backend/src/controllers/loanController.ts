/**
 * @file controllers/loanController.ts
 * @description HTTP request handlers for loan management (create, list, get, repay, delete).
 */

import { Request, Response, NextFunction } from 'express';
import { LoanService } from '../services/loanService.js';

export class LoanController {
  /**
   * POST /api/loans
   * Creates a new loan record for the authenticated user.
   */
  static async createLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const loan = await LoanService.createLoan(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Loan entry created successfully',
        data: {
          loan,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans
   * Lists all loans belonging to the authenticated user.
   * Optional query param ?status=pending|repaid|overdue|all
   */
  static async getLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const statusFilter = req.query.status as string | undefined;
      const loans = await LoanService.getLoans(userId, statusFilter);

      res.status(200).json({
        success: true,
        data: {
          loans,
          count: loans.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/loans/:id
   * Retrieves single loan details by ID for the authenticated user.
   */
  static async getLoanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const loanId = req.params.id;
      const loan = await LoanService.getLoanById(userId, loanId);

      res.status(200).json({
        success: true,
        data: {
          loan,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/loans/:id/repay
   * Marks a loan as repaid and records the repayment timestamp.
   */
  static async markAsRepaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const loanId = req.params.id;
      const loan = await LoanService.markAsRepaid(userId, loanId);

      res.status(200).json({
        success: true,
        message: 'Loan successfully marked as repaid',
        data: {
          loan,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/loans/:id
   * Deletes a loan record.
   */
  static async deleteLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const loanId = req.params.id;
      await LoanService.deleteLoan(userId, loanId);

      res.status(200).json({
        success: true,
        message: 'Loan record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
