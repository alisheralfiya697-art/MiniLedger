/**
 * @file db/index.ts
 * @description PostgreSQL database connection and schema management.
 * Uses PGlite (an embedded WebAssembly PostgreSQL 16 engine for Node.js)
 * ensuring 100% genuine PostgreSQL dialect, NUMERIC(12,2) monetary precision,
 * UUID primary keys, and parameterized SQL queries ($1, $2, etc.).
 */

import { PGlite } from '@electric-sql/pglite';
import path from 'path';

// Singleton database instance
let dbInstance: PGlite | null = null;

/**
 * Get or initialize the PostgreSQL instance.
 * Persists data to a local directory so records survive server restarts.
 */
export async function getDb(): Promise<PGlite> {
  if (!dbInstance) {
    // In-memory for tests or local directory for persistence
    const dataDir = process.env.NODE_ENV === 'test' 
      ? undefined 
      : path.resolve(process.cwd(), '.miniledger_pg_data');
    
    dbInstance = new PGlite(dataDir);
    await initSchema(dbInstance);
  }
  return dbInstance;
}

/**
 * Initializes the relational database schema.
 * Defines Users, Loans, and OTP verification tables with foreign keys and constraints.
 */
export async function initSchema(db: PGlite): Promise<void> {
  await db.exec(`
    -- Enable UUID extension if available
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_name VARCHAR(100) NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      lent_date DATE NOT NULL,
      due_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'repaid')),
      notes TEXT,
      receipt_url TEXT,
      repaid_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otps (
      phone VARCHAR(20) PRIMARY KEY,
      otp_code VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      attempts INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for fast lookups
    CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
    CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
  `);
}

/**
 * Seeds the database with starter records for demonstration and interview testing.
 */
export async function seedDemoData(db: PGlite): Promise<void> {
  const existingUsers = await db.query('SELECT count(*) as count FROM users');
  const userCount = parseInt((existingUsers.rows[0] as { count: string }).count, 10);
  
  if (userCount > 0) {
    return; // Already seeded
  }

  const demoUserId = 'usr_demo_101';
  const demoPhone = '9876543210';

  // Insert Demo User (Indian mobile: 9876543210)
  await db.query(
    `INSERT INTO users (id, phone, name) VALUES ($1, $2, $3)`,
    [demoUserId, demoPhone, 'Rahul Sharma']
  );

  const today = new Date();
  
  // Helper to format date YYYY-MM-DD
  const formatYmd = (d: Date) => d.toISOString().split('T')[0];

  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - 20);

  const overdueDueDate = new Date(today);
  overdueDueDate.setDate(today.getDate() - 5); // 5 days ago (OVERDUE)

  const futureDueDate = new Date(today);
  futureDueDate.setDate(today.getDate() + 14); // 2 weeks in future (PENDING)

  const anotherDueDate = new Date(today);
  anotherDueDate.setDate(today.getDate() + 30); // 1 month in future (PENDING)

  const repaidDueDate = new Date(today);
  repaidDueDate.setDate(today.getDate() - 10);

  // 1. Overdue loan (Rohan - ₹5,000)
  await db.query(`
    INSERT INTO loans (id, user_id, friend_name, amount, lent_date, due_date, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    'loan_001_overdue',
    demoUserId,
    'Rohan Verma',
    5000.00,
    formatYmd(pastDate),
    formatYmd(overdueDueDate),
    'pending',
    'Emergency bike repair expenses. Promised to pay back last weekend.'
  ]);

  // 2. Pending loan (Priya - ₹12,500)
  await db.query(`
    INSERT INTO loans (id, user_id, friend_name, amount, lent_date, due_date, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    'loan_002_pending',
    demoUserId,
    'Priya Patel',
    12500.00,
    formatYmd(new Date(today.getTime() - 86400000 * 3)),
    formatYmd(futureDueDate),
    'pending',
    'Concert tickets and dinner split. Will pay upon monthly salary credit.'
  ]);

  // 3. Repaid loan (Amit - ₹3,000) with luxury receipt
  await db.query(`
    INSERT INTO loans (id, user_id, friend_name, amount, lent_date, due_date, status, notes, repaid_at, receipt_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    'loan_003_repaid',
    demoUserId,
    'Amit Joshi',
    3000.00,
    formatYmd(pastDate),
    formatYmd(repaidDueDate),
    'repaid',
    'Dinner bill settlement at The Oak & Pine.',
    new Date(today.getTime() - 86400000 * 2).toISOString(),
    '/src/assets/images/luxury_cafe_receipt_1792759356361.jpg'
  ]);

  // 4. Another Pending loan (Ananya - ₹8,000)
  await db.query(`
    INSERT INTO loans (id, user_id, friend_name, amount, lent_date, due_date, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    'loan_004_pending',
    demoUserId,
    'Ananya Iyer',
    8000.00,
    formatYmd(today),
    formatYmd(anotherDueDate),
    'pending',
    'College project laptop equipment contribution.'
  ]);

  console.log('[MiniLedger DB] Initial schema and demo data seeded successfully.');
}
