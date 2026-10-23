/**
 * @file routes/summaryRoutes.ts
 * @description Summary endpoint for financial overview.
 */

import { Router } from 'express';
import { SummaryController } from '../controllers/summaryController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// GET /api/summary - Protected financial overview
router.get('/', authenticateUser, SummaryController.getSummary);

export default router;
