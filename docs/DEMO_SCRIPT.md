# MiniLedger — 2-to-3 Minute Demo Video Script

Use this structured script to record your demonstration using **Loom** or an open-source screen recorder (like OBS or QuickTime), then upload the recording to Loom or Google Drive (set link sharing to *"Anyone with the link can view"*).

---

## Recording Setup Checklist
- [ ] Browser window open at `http://localhost:3000` in **Dual View** (Phone on Left, Server Console on Right).
- [ ] Terminal running `npm run dev` visible.
- [ ] Microphone tested and clear.
- [ ] Keep video length between **2 minutes and 2 minutes 45 seconds**.

---

## Timed Script

### [0:00 - 0:25] Introduction & Authentication Flow
- **Visual**: Show the Login screen inside the mobile simulator and the server console.
- **Script**:
  > *"Hello! My name is [Your Name], and this is MiniLedger, a full-stack personal loan and repayment tracker built with Node.js, Express, TypeScript, PostgreSQL, and React Native.
  > I'll start by logging in using an Indian mobile number. I'll enter `98765 43210` and tap 'Request OTP'."*
- **Action**: Tap **Request OTP**. Point out the terminal log on the right.
- **Script**:
  > *"As specified in the assignment, our backend mock SMS gateway generates a cryptographic 6-digit OTP and logs it directly to the server terminal. Here we see the formatted box with OTP code. I'll enter the OTP and click 'Verify'."*
- **Action**: Tap **One-Click Autofill & Log In**.

---

### [0:25 - 1:00] Dashboard & Financial Summary
- **Visual**: Dashboard loads with summary cards and seeded loan records.
- **Script**:
  > *"We are now on the MiniLedger Dashboard. At the top, our summary cards display four key metrics calculated directly in PostgreSQL using a single aggregate query:
  > - Total Lent: ₹28,500
  > - Total Repaid: ₹3,000
  > - Pending Amount: ₹25,500
  > - And Overdue Amount: ₹5,000.
  > Notice that Rohan Verma's loan of ₹5,000 is clearly highlighted in red with an 'OVERDUE' badge because its due date was 5 days ago and it is still pending."*
- **Action**: Tap the **Overdue** filter tab to isolate overdue loans, then return to **All**.

---

### [1:00 - 1:40] Adding a New Loan
- **Visual**: Tap "+ Add New Loan" button.
- **Script**:
  > *"Now let's record a new loan entry. I'll tap 'Add New Loan'.
  > Our form validates friend name, positive monetary amounts, and ensures the due date cannot precede the lent date.
  > Let's enter 'Tanmay Bhatt', amount ₹2,000, set the due date for next Friday, add a note 'Concert pass booking', and select a receipt image."*
- **Action**: Fill the inputs, attach receipt, and tap **Save Loan Record**.
- **Script**:
  > *"The loan is saved using PostgreSQL parameterized queries with NUMERIC(12,2) precision. Notice our dashboard immediately updates Total Lent to ₹30,500 and Pending Amount to ₹27,500 without page reload."*

---

### [1:40 - 2:15] Loan Details & Marking as Repaid
- **Visual**: Tap on Rohan Verma's overdue loan card.
- **Script**:
  > *"Let's inspect Rohan Verma's loan details. We see the red overdue alert banner, transaction dates, and a handy button to copy a polite reminder message for WhatsApp.
  > Rohan has now transferred the money back! I'll tap 'Mark as Repaid'."*
- **Action**: Tap **Mark as Repaid**, confirm the dialog.
- **Script**:
  > *"The status instantly transitions to a green 'REPAID' badge with the repayment timestamp recorded.
  > When we return to the Dashboard, notice that the Overdue Amount has dropped to ₹0, Total Repaid has increased to ₹8,000, and the pending count is updated."*

---

### [2:15 - 2:40] Automated Tests & Code Architecture
- **Visual**: Show the server console test runner.
- **Script**:
  > *"Behind the scenes, the backend is strictly isolated by user ID via JWT middleware. To prove robustness, I'll execute our automated test suite consisting of 15 Supertest integration tests covering OTP edge cases, token rejection, input validation, cross-user isolation, and summary math."*
- **Action**: Tap **Run API Tests**. Show the 15/15 passing checks.
- **Script**:
  > *"All 15 tests pass with 100% green status. The project follows modular separation across routes, controllers, services, and database layers. Thank you for your time and consideration!"*

---

## Submission Checklist
- [ ] Video uploaded to Google Drive or Loom.
- [ ] Video sharing permission set to: **"Anyone with link can view"**.
- [ ] Test the link in an incognito browser window before submitting.
