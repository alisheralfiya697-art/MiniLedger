/**
 * @file src/utils/formatters.ts
 * @description Indian currency and date formatting utilities.
 */

/**
 * Formats a number into Indian Rupee standard format (e.g., ₹1,25,000.00).
 */
export function formatINR(amount: number, showDecimals = false): string {
  if (isNaN(amount)) return '₹0';
  
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  };

  try {
    return new Intl.NumberFormat('en-IN', options).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into readable Indian/UK date format.
 * Example: "2026-10-25" -> "25 Oct 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const cleanDate = dateString.split('T')[0];
    const [year, month, day] = cleanDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Computes overdue status and relative day count against today's date.
 */
export function getRelativeDueDateInfo(dueDateStr: string, status: string): {
  isOverdue: boolean;
  text: string;
  daysDiff: number;
} {
  if (status === 'repaid') {
    return { isOverdue: false, text: 'Repaid', daysDiff: 0 };
  }

  const cleanDate = dueDateStr.split('T')[0];
  const [year, month, day] = cleanDate.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      isOverdue: true,
      text: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      daysDiff: diffDays,
    };
  } else if (diffDays === 0) {
    return {
      isOverdue: false,
      text: 'Due today',
      daysDiff: 0,
    };
  } else if (diffDays === 1) {
    return {
      isOverdue: false,
      text: 'Due tomorrow',
      daysDiff: 1,
    };
  } else {
    return {
      isOverdue: false,
      text: `Due in ${diffDays} days`,
      daysDiff: diffDays,
    };
  }
}
