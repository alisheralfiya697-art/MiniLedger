/**
 * @file routes/loanRoutes.ts
 * @description Loan management endpoints with JWT protection and validation.
 */

import { Router } from 'express';
import { LoanController } from '../controllers/loanController.js';
import { authenticateUser } from '../middleware/auth.js';
import { validateBody } from '../middleware/errorHandler.js';
import { createLoanSchema } from '../validators/index.js';

const router = Router();

// Protect all loan routes with JWT authentication
router.use(authenticateUser);

// POST /api/loans - Create a new loan
router.post('/', validateBody(createLoanSchema), LoanController.createLoan);

// GET /api/loans - List all loans for the authenticated user (supports ?status=all|pending|repaid|overdue)
router.get('/', LoanController.getLoans);

// GET /api/loans/:id - Retrieve single loan details
router.get('/:id', LoanController.getLoanById);

// PATCH /api/loans/:id/repay - Mark loan as repaid
router.patch('/:id/repay', LoanController.markAsRepaid);

// DELETE /api/loans/:id - Delete a loan
router.delete('/:id', LoanController.deleteLoan);

export default router;
