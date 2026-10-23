/**
 * @file routes/logRoutes.ts
 * @description Developer logs and environment diagnostics endpoint.
 * Enables the in-app terminal console drawer to display real-time server output,
 * including Mock OTPs and database events.
 */

import { Router, Request, Response } from 'express';
import { getRecentLogs, clearLogs, addLog } from '../utils/logger.js';
import { getDb, seedDemoData } from '../db/index.js';

const router = Router();

// GET /api/logs - Fetch recent terminal log entries
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      logs: getRecentLogs(),
    },
  });
});

// POST /api/logs/clear - Clear log buffer
router.post('/clear', (req: Request, res: Response) => {
  clearLogs();
  res.status(200).json({ success: true, message: 'Logs cleared' });
});

// POST /api/dev/reset-demo - Reset demo user and sample data
router.post('/reset-demo', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.exec(`
      DELETE FROM otps;
      DELETE FROM loans;
      DELETE FROM users;
    `);
    await seedDemoData(db);
    addLog('info', 'Database reset to initial demo state');
    res.status(200).json({ success: true, message: 'Demo data reseeded' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
