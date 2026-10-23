/**
 * @file app.ts
 * @description Configures and exports the Express application instance with all middleware and routes.
 * Exported separately from server listener for seamless Supertest API testing.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import logRoutes from './routes/logRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { addLog } from './utils/logger.js';

export function createExpressApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // Support base64 receipt attachments

  // Request logger middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only log non-polling API requests
    if (req.path.startsWith('/api') && !req.path.includes('/logs')) {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        addLog('info', `${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
      });
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      app: 'MiniLedger API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/summary', summaryRoutes);
  app.use('/api/logs', logRoutes);

  // Centralized Error Handler (must be last middleware)
  app.use(errorHandler);

  return app;
}
