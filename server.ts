/**
 * @file server.ts
 * @description Full-stack application server entry point.
 * Hosts the Express REST API under /api/* and mounts Vite SPA middlewares for the interactive client.
 * Features automatic port resolution (falls back to 3001, 3002... if 3000 is occupied),
 * shares the HTTP server for Vite HMR to avoid WebSocket port collisions,
 * and prints standard clickable URLs immediately for VS Code and terminals.
 */

import { createExpressApp } from './backend/src/app.js';
import { getDb, seedDemoData } from './backend/src/db/index.js';
import { addLog } from './backend/src/utils/logger.js';
import { config } from './backend/src/config/index.js';
import path from 'path';
import express from 'express';
import http from 'http';
import net from 'net';

/**
 * Tests whether a port is free; if occupied, tries the next port automatically.
 */
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`  [Notice] Port ${startPort} is already in use, trying port ${startPort + 1}...`);
          resolve(findAvailablePort(startPort + 1));
        } else {
          resolve(startPort);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(startPort)).close();
      })
      .listen(startPort, '0.0.0.0');
  });
}

async function startServer() {
  const app = createExpressApp();
  const httpServer = http.createServer(app);

  // In development, mount Vite dev server as middleware
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('[Vite Middleware]:', viteErr);
    }
  } else {
    // In production, serve the built static SPA
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Desired port from config (defaults to 3000)
  const initialPort = config.port || 3000;
  
  // Find an available port if 3000 is occupied by a background process
  const actualPort = await findAvailablePort(initialPort);

  httpServer.listen(actualPort, '0.0.0.0', () => {
    // Print standard, uncolored URL lines that VS Code and terminals automatically parse as clickable links
    console.log('\n');
    console.log('  ======================================================');
    console.log('  🚀 MiniLedger Full-Stack App is running successfully!');
    console.log('  ======================================================\n');
    console.log(`  ➜  Local:   http://localhost:${actualPort}/`);
    console.log(`  ➜  Network: http://127.0.0.1:${actualPort}/`);
    console.log(`  ➜  REST API: http://localhost:${actualPort}/api\n`);
    console.log(`  👉 Ctrl+Click (or Cmd+Click) on http://localhost:${actualPort}/ to open.`);
    console.log('  👉 Demo login phone: 9876543210 (Mock OTP will print below)\n');
  });

  httpServer.on('error', (err: any) => {
    console.error('[Server Error]:', err);
  });

  // Initialize PostgreSQL database and seed sample records in the background
  getDb()
    .then(async (db) => {
      await seedDemoData(db);
      addLog('info', 'PostgreSQL database initialized and seeded with demo records.');
    })
    .catch((dbErr) => {
      console.error('[Database Error]: Failed to initialize database:', dbErr);
    });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
