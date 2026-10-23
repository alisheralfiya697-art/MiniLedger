# MiniLedger — Friend Loan & Repayment Tracker

> Full Stack Development Internship Assignment Submission

MiniLedger is a clean, production-grade, full-stack personal debt and repayment tracking application. It empowers users to record money lent to friends, monitor upcoming and overdue repayment deadlines, attach receipt photos, and inspect real-time financial summaries.

---

## 1. Project Overview & Features

- **Phone-Number Authentication with Mock OTP**:
  - Validates 10-digit Indian mobile numbers (`+91` format starting with 6, 7, 8, or 9).
  - Generates secure 6-digit mock OTPs on the backend and prints them in a formatted box in the server terminal logs.
  - Rate-limited verification with a 5-minute expiry and a 3-attempt lockout safeguard.
  - Issues signed JWT tokens for strictly isolated user data access.

- **Loan Management**:
  - **Create Loan**: Record friend's name, amount in INR (`₹`), lent date, due date, optional notes, and optional receipt photo attachment.
  - **List & Filter**: View all loans, or filter by `Pending`, `Overdue`, and `Repaid`.
  - **Overdue Detection**: Loans with a due date earlier than today's date that have not been repaid are automatically computed and highlighted in **red** with an active `OVERDUE` badge.
  - **Mark as Repaid**: One-tap repayment with confirmation dialog; records the exact timestamp and removes the loan from pending/overdue totals.
  - **Transaction Details**: View full record metadata, notes, receipt photo with full-screen zoom, and a polite WhatsApp repayment reminder helper.

- **Financial Summary Metrics**:
  - Aggregated via high-performance SQL query to prevent double-counting:
    - **Total Lent**: Sum of all loans originally created.
    - **Total Repaid**: Sum of amounts for loans cleared as repaid.
    - **Pending Amount**: Sum of outstanding amounts on active loans.
    - **Overdue Amount**: Outstanding amount specifically past the due date.

- **Developer & Evaluator Experience**:
  - **Dual-View & Device Simulator**: Experience the mobile app in an authentic iPhone frame with notch and status bar alongside a live terminal console.
  - **Server Terminal & Mock SMS Drawer**: View backend stdout logs and inspect mock OTP dispatches in real-time.
  - **Automated Test Suite**: 15 comprehensive automated backend tests covering authentication, input validation, user isolation, and financial calculations.

---

## 2. Technology Stack

### Backend
- **Runtime**: Node.js (v20+ / v22+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (powered by `@electric-sql/pglite` embedded WASM engine with full standard PostgreSQL SQL dialect, parameterized queries, and `NUMERIC(12,2)` precision)
- **Authentication**: JWT (`jsonwebtoken`)
- **Validation**: Zod
- **Testing**: Supertest & TypeScript automated test runner

### Mobile Application
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`)
- **Networking**: Axios with request/response interceptors
- **Styling**: Tailwind CSS & mobile-first design tokens

---

## 3. Architecture Overview

```
                         [Client Layer]
          React Native (Expo) / Interactive Device Frame
                                │
                        HTTP REST / JSON
                    Authorization: Bearer <JWT>
                                │
                                ▼
                         [Backend Layer]
                        Express.js Server
 ┌─────────────────────────────────────────────────────────────┐
 │  - /api/auth    (requestOtp, verifyOtp)                     │
 │  - /api/loans   (create, list, getById, repay, delete)      │
 │  - /api/summary (aggregated metrics)                        │
 └──────────────┬───────────────────────────────┬──────────────┘
                │                               │
                ▼                               ▼
       [Middleware Layer]              [Service Layer]
    - authMiddleware (JWT)          - AuthService (Mock OTP)
    - validateBody (Zod)            - LoanService (Business logic)
    - errorHandler                  - Logger (Terminal capture)
                │                               │
                └───────────────┬───────────────┘
                                ▼
                        [Database Layer]
                   PostgreSQL 16 Engine
             - users table (UUID, phone, timestamps)
             - loans table (NUMERIC(12,2), dates, status)
             - otps table (hash, expiry, attempts)
```

---

## 4. Database Schema & Setup

### Tables

1. **`users`**
   - `id`: `TEXT PRIMARY KEY` (UUID/Identifier)
   - `phone`: `VARCHAR(20) UNIQUE NOT NULL` (10-digit Indian phone)
   - `name`: `VARCHAR(100)`
   - `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - `updated_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

2. **`loans`**
   - `id`: `TEXT PRIMARY KEY`
   - `user_id`: `TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `friend_name`: `VARCHAR(100) NOT NULL`
   - `amount`: `NUMERIC(12, 2) NOT NULL CHECK (amount > 0)` *(Monetary precision)*
   - `lent_date`: `DATE NOT NULL`
   - `due_date`: `DATE NOT NULL`
   - `status`: `VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'repaid'))`
   - `notes`: `TEXT`
   - `receipt_url`: `TEXT`
   - `repaid_at`: `TIMESTAMP WITH TIME ZONE`
   - `created_at`: `TIMESTAMP WITH TIME ZONE`
   - `updated_at`: `TIMESTAMP WITH TIME ZONE`

3. **`otps`**
   - `phone`: `VARCHAR(20) PRIMARY KEY`
   - `otp_code`: `VARCHAR(10) NOT NULL`
   - `expires_at`: `TIMESTAMP WITH TIME ZONE NOT NULL`
   - `attempts`: `INT DEFAULT 0`
   - `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

### Performance Indexes
- `idx_loans_user_id` on `loans(user_id)`
- `idx_loans_status` on `loans(status)`
- `idx_loans_due_date` on `loans(due_date)`
- `idx_users_phone` on `users(phone)`

The migration SQL script is located at:
`backend/migrations/001_initial_schema.sql`

---

## 5. Prerequisites & Environment Setup

- Node.js version `>= 18.0.0` (Node 20 or 22 recommended)
- npm version `>= 9.0.0`

### Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default variables:
```ini
PORT=3000
NODE_ENV=development
JWT_SECRET=miniledger-super-secure-dev-secret-key-2026
```

---

## 6. Installation & Startup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full-Stack Application (Backend + Web Simulator)
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

- **Web / Interactive Preview**: Open `http://localhost:3000` in your browser.
- **Backend REST API**: Available at `http://localhost:3000/api`.

---

## 7. Connecting React Native (Expo) Mobile App

The repository includes the React Native Expo mobile codebase in `/mobile`.

### Running on Expo:
1. Navigate to the mobile folder:
   ```bash
   cd mobile
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

### Connecting to the Local Backend:
In `mobile/src/services/api.ts`, configure the `baseURL`:
- **Android Emulator**: `http://10.0.2.2:3000/api`
- **iOS Simulator**: `http://localhost:3000/api`
- **Physical Phone (Expo Go)**: `http://<YOUR_COMPUTER_LAN_IP>:3000/api` (e.g. `http://192.168.1.5:3000/api`)

---

## 8. OTP Testing Instructions

1. On the Login screen, enter any valid 10-digit Indian phone number (or click **"Fill Demo (+91 98765 43210)"**).
2. Click **Request OTP**.
3. Check your server terminal window. You will see the mock SMS gateway dispatch box:
   ```text
   ╔══════════════════════════════════════════════════════════╗
   ║           MINILEDGER MOCK SMS GATEWAY (LOCAL DEV)        ║
   ╠══════════════════════════════════════════════════════════╣
   ║ Recipient : +91 9876543210                               ║
   ║ One-Time Password (OTP) : 482910                         ║
   ║ Validity  : 5 minutes                                    ║
   ║ * Mock notification printed to terminal for assignment.  ║
   ╚══════════════════════════════════════════════════════════╝
   ```
4. Enter the 6-digit OTP code into the input boxes, or click **"One-Click Autofill & Log In"** in the app.

---

## 9. Automated Testing

To run the backend test suite:
```bash
npm test
```

### Test Coverage (15/15 Passing):
- **Authentication**: Valid phone OTP generation, invalid phone format rejection (400), wrong OTP code rejection with remaining attempts counter, correct OTP verification with JWT issuance.
- **Security & Authorization**: Missing Bearer token rejection (401), malformed JWT token handling.
- **Loan Validation**: Negative amount rejection (400), due date earlier than lent date rejection (400), past due date automatically setting `is_overdue = true`.
- **Data Isolation**: User B receives 404 and cannot access or modify User A's loan entries.
- **Repayment & Financial Summary**: Accurate computation of `totalLent`, `totalRepaid`, `pendingAmount`, and `overdueAmount` without double-counting.

---

## 10. REST API Documentation

### Base URL: `/api`

### Authentication
- `POST /api/auth/request-otp`
  - **Body**: `{ "phone": "9876543210" }`
  - **Response 200**:
    ```json
    {
      "success": true,
      "message": "Mock OTP generated and printed to server logs for +91 98****3210",
      "data": { "phone": "9876543210", "expiresInSeconds": 300, "debugOtp": "482910" }
    }
    ```

- `POST /api/auth/verify-otp`
  - **Body**: `{ "phone": "9876543210", "otp": "482910" }`
  - **Response 200**:
    ```json
    {
      "success": true,
      "message": "Authentication successful",
      "data": {
        "token": "eyJhbGciOi...",
        "user": { "id": "usr_demo_101", "phone": "9876543210", "name": "Rahul Sharma" }
      }
    }
    ```

### Loans (Requires `Authorization: Bearer <token>`)
- `POST /api/loans`
  - **Body**:
    ```json
    {
      "friend_name": "Rohan Verma",
      "amount": 5000,
      "lent_date": "2026-10-01",
      "due_date": "2026-10-15",
      "notes": "Emergency repair advance"
    }
    ```
  - **Response 201**: Returns created loan with `is_overdue` computed.

- `GET /api/loans?status={all|pending|repaid|overdue}`
  - **Response 200**: Returns array of loans belonging strictly to authenticated user.

- `GET /api/loans/:id`
  - **Response 200**: Returns single loan details. Returns `404` if nonexistent or owned by another user.

- `PATCH /api/loans/:id/repay`
  - **Response 200**: Marks loan as repaid and updates `repaid_at` timestamp.

- `DELETE /api/loans/:id`
  - **Response 200**: Deletes loan record.

### Financial Summary
- `GET /api/summary`
  - **Response 200**:
    ```json
    {
      "success": true,
      "data": {
        "summary": {
          "totalLent": 28500,
          "totalRepaid": 3000,
          "pendingAmount": 25500,
          "overdueAmount": 5000,
          "currency": "INR",
          "counts": {
            "total": 4,
            "pending": 3,
            "repaid": 1,
            "overdue": 1
          }
        }
      }
    }
    ```

---

## 11. Definition of Financial Metrics

- **Total Lent**: Cumulative sum of principal amounts of all loans created by the user:
  $$\sum \text{amount}_{\text{all}}$$
- **Total Repaid**: Sum of original loan amounts for loans whose repayment status is `'repaid'`:
  $$\sum \text{amount}_{\text{status} = \text{'repaid'}}$$
- **Pending Amount**: Total outstanding money currently awaiting repayment:
  $$\sum \text{amount}_{\text{status} = \text{'pending'}}$$
- **Overdue Amount**: Subset of pending money where the repayment deadline has passed:
  $$\sum \text{amount}_{\text{status} = \text{'pending'} \land \text{due\_date} < \text{CURRENT\_DATE}}$$

---

## 12. Screenshots Section

*(To add screenshots to your repository, capture images of the running application and place them in a `docs/screenshots/` folder)*

- `docs/screenshots/01_login_otp.png` — Login screen with phone number and OTP prompt.
- `docs/screenshots/02_dashboard_overdue.png` — Dashboard highlighting the red overdue loan and summary cards.
- `docs/screenshots/03_add_loan.png` — Form for recording a new loan entry.
- `docs/screenshots/04_loan_details.png` — Loan details screen with "Mark as Repaid" modal.

---

## 13. GitHub Publishing Guide

To publish this project to GitHub:

```bash
# 1. Initialize git repository
git init

# 2. Add files (respects .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete MiniLedger full-stack friend loan tracker with mock OTP, PostgreSQL, and React Native"

# 4. Set main branch and link your remote
git branch -M main
git remote add origin https://github.com/<your-username>/miniledger.git

# 5. Push code
git push -u origin main
```
