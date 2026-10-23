/**
 * @file utils/logger.ts
 * @description In-memory and terminal logger.
 * Captures server logs and mock OTP dispatches for real-time inspection
 * in both the terminal and the interactive frontend console drawer.
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'otp';
  message: string;
  details?: Record<string, unknown> | null;
}

// In-memory ring buffer of recent logs (latest 100)
const logBuffer: LogEntry[] = [];
const MAX_BUFFER = 100;

export function addLog(level: LogEntry['level'], message: string, details?: Record<string, unknown> | null): LogEntry {
  const entry: LogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  };

  logBuffer.unshift(entry);
  if (logBuffer.length > MAX_BUFFER) {
    logBuffer.pop();
  }

  // Print nicely to terminal
  const time = new Date().toLocaleTimeString();
  switch (level) {
    case 'error':
      console.error(`\x1b[31m[${time}] [ERROR] ${message}\x1b[0m`, details || '');
      break;
    case 'warn':
      console.warn(`\x1b[33m[${time}] [WARN] ${message}\x1b[0m`, details || '');
      break;
    case 'otp':
      // Specially styled for Mock OTP assignment requirement
      console.log(`\n\x1b[36m╔══════════════════════════════════════════════════════════╗\x1b[0m`);
      console.log(`\x1b[36m║           MINILEDGER MOCK SMS GATEWAY (LOCAL DEV)        ║\x1b[0m`);
      console.log(`\x1b[36m╠══════════════════════════════════════════════════════════╣\x1b[0m`);
      console.log(`\x1b[32m║ Recipient : +91 ${details?.phone || 'N/A'}\x1b[0m`);
      console.log(`\x1b[33m║ One-Time Password (OTP) : \x1b[1m\x1b[37m${details?.otp}\x1b[0m\x1b[33m                   ║\x1b[0m`);
      console.log(`\x1b[36m║ Validity  : 5 minutes                                    ║\x1b[0m`);
      console.log(`\x1b[90m║ * Mock notification printed to terminal for assignment.   ║\x1b[0m`);
      console.log(`\x1b[36m╚══════════════════════════════════════════════════════════╝\x1b[0m\n`);
      break;
    default:
      console.log(`\x1b[34m[${time}] [INFO]\x1b[0m ${message}`, details || '');
  }

  return entry;
}

export function getRecentLogs(): LogEntry[] {
  return [...logBuffer];
}

export function clearLogs(): void {
  logBuffer.length = 0;
}
