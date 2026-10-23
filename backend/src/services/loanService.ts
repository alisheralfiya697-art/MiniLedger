/**
 * @file services/loanService.ts
 * @description Business logic and PostgreSQL operations for loan management and financial summaries.
 */

import { getDb } from '../db/index.js';
import { Loan, FinancialSummary, LoanStatus } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { addLog } from '../utils/logger.js';

interface RawLoanRow {
  id: string;
  user_id: string;
  friend_name: string;
  amount: string | number;
  lent_date: string;
  due_date: string;
  status: LoanStatus;
  notes: string | null;
  receipt_url: string | null;
  repaid_at: string | null;
  created_at: string;
  updated_at: string;
}

export class LoanService {
  /**
   * Helper to transform a raw DB row to our typed Loan object,
   * computing the `is_overdue` status based on today's calendar date.
   */
  private static formatLoanRow(row: RawLoanRow): Loan {
    // Current date in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Normalize due_date string (PGlite dates can be string or Date object)
    let dueDateStr = typeof row.due_date === 'string' ? row.due_date : new Date(row.due_date).toISOString().split('T')[0];
    if (dueDateStr.includes('T')) {
      dueDateStr = dueDateStr.split('T')[0];
    }

    let lentDateStr = typeof row.lent_date === 'string' ? row.lent_date : new Date(row.lent_date).toISOString().split('T')[0];
    if (lentDateStr.includes('T')) {
      lentDateStr = lentDateStr.split('T')[0];
    }

    // A loan is overdue when it has not been repaid AND due_date < current date
    const isOverdue = row.status === 'pending' && dueDateStr < todayStr;

    return {
      id: row.id,
      user_id: row.user_id,
      friend_name: row.friend_name,
      amount: parseFloat(row.amount.toString()),
      lent_date: lentDateStr,
      due_date: dueDateStr,
      status: row.status,
      notes: row.notes,
      receipt_url: row.receipt_url,
      repaid_at: row.repaid_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_overdue: isOverdue,
    };
  }

  /**
   * Creates a new loan entry for the authenticated user.
   */
  static async createLoan(
    userId: string,
    data: {
      friend_name: string;
      amount: number;
      lent_date: string;
      due_date: string;
      notes?: string | null;
      receipt_url?: string | null;
    }
  ): Promise<Loan> {
    const db = await getDb();
    const loanId = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Round amount to 2 decimal places for NUMERIC(12,2)
    const roundedAmount = Math.round(data.amount * 100) / 100;

    const result = await db.query(`
      INSERT INTO loans (
        id, user_id, friend_name, amount, lent_date, due_date, status, notes, receipt_url
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
      RETURNING *
    `, [
      loanId,
      userId,
      data.friend_name.trim(),
      roundedAmount,
      data.lent_date,
      data.due_date,
      data.notes ? data.notes.trim() : null,
      data.receipt_url || null,
    ]);

    const createdLoan = this.formatLoanRow(result.rows[0] as unknown as RawLoanRow);
    addLog('info', `Created loan ${loanId} for user ${userId}: ₹${roundedAmount} to ${data.friend_name}`);
    return createdLoan;
  }

  /**
   * Retrieves all loans belonging to the authenticated user.
   * Supports filtering by status: 'all' | 'pending' | 'repaid' | 'overdue'.
   */
  static async getLoans(userId: string, filterStatus?: string): Promise<Loan[]> {
    const db = await getDb();
    
    const result = await db.query(
      `SELECT * FROM loans WHERE user_id = $1 ORDER BY due_date ASC, created_at DESC`,
      [userId]
    );

    const loans = (result.rows as unknown as RawLoanRow[]).map((row) => this.formatLoanRow(row));

    if (!filterStatus || filterStatus === 'all') {
      return loans;
    }

    if (filterStatus === 'overdue') {
      return loans.filter((loan) => loan.is_overdue);
    }

    return loans.filter((loan) => loan.status === filterStatus);
  }

  /**
   * Retrieves a single loan by ID, ensuring it belongs to the authenticated user.
   */
  static async getLoanById(userId: string, loanId: string): Promise<Loan> {
    const db = await getDb();

    const result = await db.query(
      `SELECT * FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Loan record not found or you do not have permission to view it.', 404, 'LOAN_NOT_FOUND');
    }

    return this.formatLoanRow(result.rows[0] as unknown as RawLoanRow);
  }

  /**
   * Marks a loan as repaid and records the timestamp.
   */
  static async markAsRepaid(userId: string, loanId: string): Promise<Loan> {
    const db = await getDb();

    // Verify ownership and existence
    const checkResult = await db.query(
      `SELECT * FROM loans WHERE id = $1 AND user_id = $2`,
      [loanId, userId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('Loan record not found or you do not have permission to modify it.', 404, 'LOAN_NOT_FOUND');
    }

    const existing = checkResult.rows[0] as unknown as RawLoanRow;
    if (existing.status === 'repaid') {
      return this.formatLoanRow(existing);
    }

    const updateResult = await db.query(`
      UPDATE loans
      SET status = 'repaid', repaid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [loanId, userId]);

    const updatedLoan = this.formatLoanRow(updateResult.rows[0] as unknown as RawLoanRow);
    addLog('info', `Marked loan ${loanId} as repaid by user ${userId}`);
    return updatedLoan;
  }

  /**
   * Deletes a loan belonging to the authenticated user.
   */
  static async deleteLoan(userId: string, loanId: string): Promise<void> {
    const db = await getDb();
    const result = await db.query(
      `DELETE FROM loans WHERE id = $1 AND user_id = $2 RETURNING id`,
      [loanId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Loan record not found or you do not have permission to delete it.', 404, 'LOAN_NOT_FOUND');
    }

    addLog('info', `Deleted loan ${loanId} for user ${userId}`);
  }

  /**
   * Calculates comprehensive financial summary for the authenticated user.
   * Ensures amounts are never double-counted and correctly segments:
   * - totalLent: sum of all loans created
   * - totalRepaid: sum of loans marked 'repaid'
   * - pendingAmount: sum of active loans marked 'pending'
   * - overdueAmount: sum of pending loans where due_date < CURRENT_DATE
   */
  static async getSummary(userId: string): Promise<FinancialSummary> {
    const db = await getDb();

    const todayStr = new Date().toISOString().split('T')[0];

    // Single aggregated SQL query for accuracy and performance
    const query = `
      SELECT 
        COALESCE(SUM(amount), 0) AS total_lent,
        COALESCE(SUM(CASE WHEN status = 'repaid' THEN amount ELSE 0 END), 0) AS total_repaid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < $2::date THEN amount ELSE 0 END), 0) AS overdue_amount,
        COUNT(*) AS count_total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS count_pending,
        COUNT(CASE WHEN status = 'repaid' THEN 1 END) AS count_repaid,
        COUNT(CASE WHEN status = 'pending' AND due_date < $2::date THEN 1 END) AS count_overdue
      FROM loans
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId, todayStr]);
    const row = result.rows[0] as {
      total_lent: string | number;
      total_repaid: string | number;
      pending_amount: string | number;
      overdue_amount: string | number;
      count_total: string | number;
      count_pending: string | number;
      count_repaid: string | number;
      count_overdue: string | number;
    };

    return {
      totalLent: parseFloat(row.total_lent.toString()),
      totalRepaid: parseFloat(row.total_repaid.toString()),
      pendingAmount: parseFloat(row.pending_amount.toString()),
      overdueAmount: parseFloat(row.overdue_amount.toString()),
      currency: 'INR',
      counts: {
        total: parseInt(row.count_total.toString(), 10),
        pending: parseInt(row.count_pending.toString(), 10),
        repaid: parseInt(row.count_repaid.toString(), 10),
        overdue: parseInt(row.count_overdue.toString(), 10),
      },
    };
  }
}
