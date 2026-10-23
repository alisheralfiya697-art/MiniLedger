/**
 * @file tests/api.test.ts
 * @description Comprehensive backend API automated test suite.
 * Tests:
 * 1. Mock OTP request & verification (positive & edge cases)
 * 2. Missing & invalid JWT tokens
 * 3. Loan creation with valid & invalid inputs (negative amounts, invalid dates)
 * 4. User data isolation (preventing cross-user unauthorized access)
 * 5. Marking loans as repaid & state transitions
 * 6. Financial summary calculations (totalLent, totalRepaid, pending, overdue)
 */

import request from 'supertest';
import { createExpressApp } from '../backend/src/app.js';
import { getDb } from '../backend/src/db/index.js';

async function runTests() {
  console.log('\n\x1b[35m=======================================================');
  console.log('       MINILEDGER API AUTOMATED TEST SUITE');
  console.log('=======================================================\x1b[0m\n');

  // Initialize DB in memory/test mode
  process.env.NODE_ENV = 'test';
  await getDb();
  const app = createExpressApp();

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(` \x1b[32m✔ PASS\x1b[0m ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(` \x1b[31m✖ FAIL\x1b[0m ${name}`);
      console.error(`   Error: ${(err as Error).message}`);
      failed++;
    }
  }

  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // Shared test variables
  const testPhoneA = '9876500001';
  const testPhoneB = '9876500002';
  let tokenUserA = '';
  let tokenUserB = '';
  let loanAId = '';

  console.log('\x1b[36m--- Section 1: Authentication & Mock OTP Tests ---\x1b[0m');

  await test('POST /api/auth/request-otp with valid Indian phone generates OTP', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .send({ phone: testPhoneA });

    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Response success should be true');
    assert(res.body.data.phone === testPhoneA, 'Phone should match');
    assert(res.body.data.debugOtp && res.body.data.debugOtp.length === 6, 'Should return 6-digit OTP in test environment');
  });

  await test('POST /api/auth/request-otp with invalid phone returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/request-otp')
      .send({ phone: '123' }); // Invalid: too short, doesn't start with 6-9

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.success === false, 'Should fail validation');
  });

  await test('POST /api/auth/verify-otp with incorrect OTP returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhoneA, otp: '000000' });

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error.code === 'INVALID_OTP', `Expected INVALID_OTP, got ${res.body.error?.code}`);
  });

  await test('POST /api/auth/verify-otp with correct OTP returns JWT token and user info', async () => {
    // 1. Request fresh OTP
    const reqRes = await request(app)
      .post('/api/auth/request-otp')
      .send({ phone: testPhoneA });
    const otp = reqRes.body.data.debugOtp;

    // 2. Verify with that OTP
    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhoneA, otp });

    assert(verifyRes.status === 200, `Expected 200, got ${verifyRes.status}`);
    assert(typeof verifyRes.body.data.token === 'string', 'Should return JWT token string');
    assert(verifyRes.body.data.user.phone === testPhoneA, 'User phone should match');

    tokenUserA = verifyRes.body.data.token;
  });

  await test('Setup: Create second authenticated user B for cross-user isolation tests', async () => {
    const reqRes = await request(app).post('/api/auth/request-otp').send({ phone: testPhoneB });
    const otp = reqRes.body.data.debugOtp;
    const verifyRes = await request(app).post('/api/auth/verify-otp').send({ phone: testPhoneB, otp });
    assert(verifyRes.status === 200, 'User B login should succeed');
    tokenUserB = verifyRes.body.data.token;
  });

  console.log('\n\x1b[36m--- Section 2: JWT Security & Protected Routes ---\x1b[0m');

  await test('GET /api/loans without token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/loans');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    assert(res.body.error.code === 'UNAUTHORIZED', 'Error code should be UNAUTHORIZED');
  });

  await test('GET /api/loans with corrupted token returns 401', async () => {
    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', 'Bearer invalid-token-string');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  console.log('\n\x1b[36m--- Section 3: Loan Management & Input Validation ---\x1b[0m');

  await test('POST /api/loans with negative amount fails validation (400)', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        friend_name: 'Vikas',
        amount: -500,
        lent_date: '2026-10-01',
        due_date: '2026-10-15',
      });

    assert(res.status === 400, `Expected 400 for negative amount, got ${res.status}`);
  });

  await test('POST /api/loans with due_date earlier than lent_date fails validation (400)', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        friend_name: 'Vikas',
        amount: 1000,
        lent_date: '2026-10-20',
        due_date: '2026-10-10', // Invalid: before lent date
      });

    assert(res.status === 400, `Expected 400 for invalid date sequence, got ${res.status}`);
  });

  await test('POST /api/loans with valid data creates pending loan (201)', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        friend_name: 'Kabir Verma',
        amount: 2500,
        lent_date: '2026-10-01',
        due_date: '2026-11-01',
        notes: 'Hostel rent advance',
      });

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.loan.friend_name === 'Kabir Verma', 'Friend name should match');
    assert(res.body.data.loan.amount === 2500, 'Amount should be 2500');
    assert(res.body.data.loan.status === 'pending', 'Status should default to pending');
    assert(res.body.data.loan.is_overdue === false, 'Future loan should not be overdue');

    loanAId = res.body.data.loan.id;
  });

  await test('POST /api/loans with past due date correctly sets is_overdue to true', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        friend_name: 'Sameer Sen',
        amount: 1500,
        lent_date: '2026-09-01',
        due_date: '2026-09-15', // Past date!
        notes: 'Train ticket reimbursement',
      });

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.loan.is_overdue === true, 'Past due loan must be computed as is_overdue: true');
  });

  console.log('\n\x1b[36m--- Section 4: Cross-User Security & Authorization ---\x1b[0m');

  await test('User B CANNOT access or view User A\'s loan (404/Isolated)', async () => {
    const res = await request(app)
      .get(`/api/loans/${loanAId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    assert(res.status === 404, `User B should receive 404 when querying User A's loan, got ${res.status}`);
  });

  await test('User B CANNOT mark User A\'s loan as repaid (404/Unauthorized)', async () => {
    const res = await request(app)
      .patch(`/api/loans/${loanAId}/repay`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    assert(res.status === 404, `User B should not be able to modify User A's loan, got ${res.status}`);
  });

  console.log('\n\x1b[36m--- Section 5: Repayments & Summary Calculations ---\x1b[0m');

  await test('PATCH /api/loans/:id/repay marks loan as repaid and records timestamp', async () => {
    const res = await request(app)
      .patch(`/api/loans/${loanAId}/repay`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.loan.status === 'repaid', 'Status should be updated to repaid');
    assert(typeof res.body.data.loan.repaid_at === 'string', 'Repaid timestamp should be set');
    assert(res.body.data.loan.is_overdue === false, 'Repaid loan should not be flagged as overdue');
  });

  await test('GET /api/summary returns accurate aggregations without double counting', async () => {
    // User A currently has:
    // 1. loanA: ₹2500 (repaid)
    // 2. loan 2 (Sameer): ₹1500 (pending & overdue)
    // Total lent = 2500 + 1500 = 4000
    // Total repaid = 2500
    // Pending amount = 1500
    // Overdue amount = 1500

    const res = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${tokenUserA}`);

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const summary = res.body.data.summary;

    assert(summary.totalLent === 4000, `Expected totalLent 4000, got ${summary.totalLent}`);
    assert(summary.totalRepaid === 2500, `Expected totalRepaid 2500, got ${summary.totalRepaid}`);
    assert(summary.pendingAmount === 1500, `Expected pendingAmount 1500, got ${summary.pendingAmount}`);
    assert(summary.overdueAmount === 1500, `Expected overdueAmount 1500, got ${summary.overdueAmount}`);
    assert(summary.counts.total === 2, `Expected 2 total loans, got ${summary.counts.total}`);
    assert(summary.counts.repaid === 1, `Expected 1 repaid loan, got ${summary.counts.repaid}`);
    assert(summary.counts.pending === 1, `Expected 1 pending loan, got ${summary.counts.pending}`);
    assert(summary.counts.overdue === 1, `Expected 1 overdue loan, got ${summary.counts.overdue}`);
  });

  console.log('\n\x1b[35m=======================================================');
  console.log(` RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('=======================================================\x1b[0m\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
