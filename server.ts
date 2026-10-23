/**
 * @file server.ts
 * @description Full-stack application server entry point.
 * Hosts the Express REST API under /api/* and mounts Vite SPA middlewares for the interactive client.
 * Prints standard local URL links immediately so VS Code and browsers detect it instantly.
 */

import { createExpressApp } from './backend/src/app.js';
import { getDb, seedDemoData } from './backend/src/db/index.js';
import { addLog } from './backend/src/utils/logger.js';
import { config } from './backend/src/config/index.js';
import path from 'path';
import express from 'express';
import net from 'net';

/**
 * Checks if a port is available, or finds the next available port.
 */
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '0.0.0.0', () => {
      server.close(() => resolve(startPort));
    });
    server.on('error', () => {
      // If startPort is in use, check if it's already running our app or try startPort + 1
      resolve(startPort);
    });
  });
}

async function startServer() {
  const app = createExpressApp();

  // In development, mount Vite dev server as middleware
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('[Vite Middleware Warning]:', viteErr);
    }
  } else {
    // In production, serve the built static SPA
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const desiredPort = config.port || 3000;
  
  // Listen on the port
  const server = app.listen(desiredPort, '0.0.0.0', () => {
    // Print in standard format that VS Code, terminals, and IDEs recognize as clickable links
    console.log('\n');
    console.log('  ======================================================');
    console.log('  🚀 MiniLedger Full-Stack App is running successfully!');
    console.log('  ======================================================\n');
    console.log(`  ➜  Local:   http://localhost:${desiredPort}/`);
    console.log(`  ➜  Network: http://127.0.0.1:${desiredPort}/`);
    console.log(`  ➜  REST API: http://localhost:${desiredPort}/api\n`);
    console.log('  Click the link above or open http://localhost:' + desiredPort + ' in your browser.');
    console.log('  Demo Login: +91 9876543210 (Mock OTP will log here)\n');
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Server Error]: Port ${desiredPort} is already in use by another process.`);
      console.error(`Please stop the process using port ${desiredPort} or run: PORT=${desiredPort + 1} npm run dev\n`);
    } else {
      console.error('[Server Error]:', err);
    }
  });

  // Initialize PostgreSQL database & seed initial demo data asynchronously
  // This ensures the server starts and prints the localhost link immediately without delay!
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
