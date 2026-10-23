/**
 * @file server.ts
 * @description Full-stack application server entry point.
 * Hosts the Express REST API under /api/* and mounts Vite SPA middlewares for the interactive client.
 */

import { createExpressApp } from './backend/src/app.js';
import { getDb, seedDemoData } from './backend/src/db/index.js';
import { addLog } from './backend/src/utils/logger.js';
import { config } from './backend/src/config/index.js';
import path from 'path';
import express from 'express';

async function startServer() {
  const app = createExpressApp();

  // Initialize PostgreSQL database & seed initial demo data
  try {
    const db = await getDb();
    await seedDemoData(db);
    addLog('info', 'PostgreSQL database ready and seeded with demo records.');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // In development, mount Vite dev server as middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built static SPA
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = config.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n\x1b[32m🚀 MiniLedger Full-Stack Server running at http://localhost:${PORT}\x1b[0m`);
    console.log(`\x1b[36m👉 REST API available at http://localhost:${PORT}/api\x1b[0m`);
    console.log(`\x1b[33m🔑 Demo Indian Mobile: 9876543210 (Rahul Sharma)\x1b[0m\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
