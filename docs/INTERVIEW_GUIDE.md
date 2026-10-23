# MiniLedger — Fresher Interview Preparation Guide

This guide is designed to help you confidently answer technical questions about your MiniLedger project during a Full-Stack Developer internship interview.

---

## 1. System Architecture & Layer Separation

### Q: How is the backend organized, and why did you choose this pattern?
> **Answer**:
> *"The backend follows a standard 4-tier layered architecture:
> 1. **Routes (`/routes`)**: Define API endpoints, HTTP methods, and bind middleware.
> 2. **Controllers (`/controllers`)**: Handle HTTP request extraction, status codes, and JSON responses.
> 3. **Services (`/services`)**: Encapsulate all business logic (e.g., OTP generation rules, date-based overdue calculations).
> 4. **Database Access Layer (`/db`)**: Manages the PostgreSQL connection pool, schema initialization, and parameterized SQL queries.
>
> This separation of concerns makes the code clean, modular, and easy to unit test. For example, our test suite can test business logic or mock controllers without coupling to the HTTP server."*

---

## 2. Authentication & Mock OTP

### Q: How does the Mock OTP system work, and how would you transition it to production?
> **Answer**:
> *"For local development and testing, our backend generates a secure 6-digit random number (`100000 - 999999`) using Node.js crypto/random generation. We store this code in PostgreSQL with an expiration timestamp (`CURRENT_TIMESTAMP + 5 minutes`) and an attempt counter.
> The OTP is formatted and logged to `stdout` in the terminal instead of sending an actual SMS, preventing SMS gateway charges during development.
>
> **Transition to Production**:
> To go to production, we would replace the `addLog('otp', ...)` call in `AuthService.requestOtp()` with a third-party SMS provider SDK such as **Twilio**, **AWS SNS**, or **Fast2SMS**. We would also:
> 1. Store only a cryptographic bcrypt or SHA-256 hash of the OTP in the database.
> 2. Add an IP and phone-based rate limiter (e.g., via Redis) to prevent SMS bombing.
> 3. Enforce SMS sender ID registration according to Indian TRAI DLT regulations."*

---

## 3. Database Design: NUMERIC vs. FLOAT

### Q: Why did you use PostgreSQL `NUMERIC(12,2)` instead of `FLOAT` or `DOUBLE PRECISION`?
> **Answer**:
> *"In financial systems, floating-point numbers (`FLOAT` or `REAL`) follow the IEEE 754 standard, which represents numbers in binary. This causes binary rounding errors — for example, `0.1 + 0.2` in floating point equals `0.30000000000000004`. Over thousands of transactions, fractional pennies compound into significant discrepancies.
> PostgreSQL `NUMERIC` (or `DECIMAL`) stores numbers as exact arbitrary-precision base-10 representations with zero rounding error. By specifying `NUMERIC(12,2)`, we guarantee that every loan and repayment holds an exact value up to ₹999,999,999.99 with exact paise precision."*

---

## 4. Parameterized Queries & Security

### Q: How did you protect against SQL Injection?
> **Answer**:
> *"We strictly use parameterized queries with PostgreSQL place-holders (`$1, $2, ...`) for all database operations.
> Never concatenate raw user input into an SQL string:
> ```typescript
> // ❌ Dangerous SQL injection risk:
> db.query(`SELECT * FROM loans WHERE user_id = '${userId}'`);
>
> // ✅ Secure parameterized query used in MiniLedger:
> db.query(`SELECT * FROM loans WHERE user_id = $1`, [userId]);
> ```
> The PostgreSQL query planner compiles and validates the SQL syntax before binding user values as literal data, completely neutralizing SQL injection vectors."*

---

## 5. Overdue Computation & Summary Calculation

### Q: How do you define and compute an overdue loan?
> **Answer**:
> *"A loan is defined as overdue if and only if two conditions are met:
> 1. Its status is `'pending'` (it has not been repaid).
> 2. Its `due_date` is strictly earlier than the current date (`due_date < CURRENT_DATE`).
>
> If a loan has been marked as `'repaid'`, it is **never** considered overdue, even if its repayment occurred after the due date."*

### Q: How do you calculate the financial summary without double-counting?
> **Answer**:
> *"We calculate the financial summary using a single aggregate SQL query with conditional aggregations (`CASE WHEN`):
> ```sql
> SELECT 
>   COALESCE(SUM(amount), 0) AS total_lent,
>   COALESCE(SUM(CASE WHEN status = 'repaid' THEN amount ELSE 0 END), 0) AS total_repaid,
>   COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_amount,
>   COALESCE(SUM(CASE WHEN status = 'pending' AND due_date < $2::date THEN amount ELSE 0 END), 0) AS overdue_amount
> FROM loans
> WHERE user_id = $1
> ```
> This is efficient ($O(N)$ single table scan with index on `user_id`) and guarantees consistent state because each loan contributes to either pending or repaid."*

---

## 6. User Data Isolation

### Q: How do you ensure User A cannot view or manipulate User B's loans?
> **Answer**:
> *"We implement defense-in-depth:
> 1. **Authentication Layer**: The `authenticateUser` middleware decrypts and verifies the JWT signature on every protected request and extracts the verified `userId` directly from the signed token payload into `req.user`.
> 2. **Query Scoping**: Every database read, update, and delete query explicitly includes `WHERE user_id = $1` matching the verified token's user ID.
> 3. If User B tries to call `PATCH /api/loans/loan_123/repay` where `loan_123` belongs to User A, our query filters out the row and returns `404 LOAN_NOT_FOUND`, preventing authorization bypass and information leakage. This is verified by our automated test suite."*

---

## 7. Input Validation with Zod

### Q: Why do you use Zod schemas instead of manual if-else checks?
> **Answer**:
> *"Zod provides declarative, type-safe schema validation at runtime that infers static TypeScript types.
> In `backend/src/validators/index.ts`, we validate:
> - Indian mobile regex `^[6-9]\d{9}$`
> - Positive loan amount (`.positive()`)
> - Date sequence constraint: `due_date >= lent_date`
>
> If an input fails validation, our centralized middleware immediately returns a standardized `400 BAD REQUEST` error with actionable field-by-field messages before any database queries execute."*
