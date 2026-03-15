# PaySaathi — Integration Service

A receivables management service that integrates with an external accounting API, stores data locally, and exposes financial insights via a REST API and dashboard UI.

Demo video: https://www.loom.com/share/5ad76e4fb6484625b51edb1ce00f91f3
---

## Features Implemented

### Core Integration
- **External API sync** — fetches customers, invoices, and payments from the external accounting API in a single `POST /api/sync` call using `Promise.all` for parallel requests
- **Idempotent upsert** — re-running sync never creates duplicates; uses insert-or-update on `external_id`
- **Manual records preserved** — invoices and payments created manually via the UI use a `manual_` prefixed external ID and are never overwritten by sync

### Financial Insights
- **Outstanding balance per customer** — total invoiced minus total paid, computed at query time
- **Overdue invoices** — invoices past due date with `remaining > 0` (fully paid invoices are excluded)
- **Customer detail summary** — per-customer breakdown of all invoices, payments, and remaining balances
- **Dashboard analytics** — total receivables, total collected, total overdue, collection rate %, invoice status breakdown (paid / overdue / pending counts), monthly collections trend (last 6 months), top overdue customers by amount

### Invoice & Payment Management
- **Create invoice manually** — `POST /api/invoices` with customer, amount, due date
- **Record payment** — `POST /api/invoices/:id/pay` with server-side overpayment validation
- **Payment receipt** — downloadable professional PDF receipt generated in-browser after every payment (no external library required)

### Dashboard UI
- Stat cards: customers, invoices, receivables, collected, overdue, collection rate
- Line chart: monthly collections over last 6 months
- Pie chart: invoice status breakdown
- Bar chart: outstanding balance by customer
- Top overdue customers with progress bars

### Parties / Customers UI
- Card-based layout with collection progress bar per customer
- Search by name or email
- Summary bar: total invoiced, collected, outstanding across all customers
- Due / Clear status badge per card

### Invoices UI
- Full invoice list with status badges (Paid / Overdue / Pending)
- Pay button → modal with remaining balance shown, overpayment blocked
- Receipt button on invoices with any payment recorded
- Open → navigates to customer detail page

### Overdue Invoices UI
- Lists only invoices that are past due date AND have remaining balance > 0
- Pay button with modal
- Receipt button for partially paid overdue invoices

---

## Project Structure

```
PaySaathi-integration-service/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          — database schema (Customer, Invoice, Payment)
│   └── src/
│       ├── mockApi.js             — simulates the external accounting system (port 4000)
│       ├── server.js              — Express app entry point, middleware, route mounting
│       ├── db.js                  — single Prisma client instance
│       └── routes/
│           ├── sync.js            — integration layer: fetch & upsert from external API
│           ├── customers.js       — customer list and detail endpoints
│           ├── invoices.js        — invoice CRUD + payment recording
│           └── insights.js        — aggregated financial analytics
└── frontend/
    └── src/
        ├── api/api.js             — all Axios API calls in one place
        ├── utils/printReceipt.js  — browser-native receipt PDF generator
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── Table.jsx
        │   ├── Badge.jsx
        │   ├── StatCard.jsx
        │   └── Toast.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Customers.jsx
            ├── CustomerDetail.jsx
            ├── Invoices.jsx
            └── OverdueInvoices.jsx
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/paysaathi"
EXTERNAL_API_URL="http://localhost:4000"
PORT=3000
```

### 3. Run Database Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Start All Services

```bash
# Terminal 1 — Mock API (port 4000) + Backend (port 3000) together
cd backend
npm start

# Terminal 2 — Frontend dashboard (port 5173)
cd frontend
npm run dev
```

Or run them separately during development:

```bash
# Mock API only
cd backend && npm run mock

# Backend only (with auto-reload)
cd backend && npm run dev
```

### 5. Sync Data

Open `http://localhost:5173` and click **Sync Data** to pull from the external API into the local database.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sync` | Fetch & upsert all data from external API |
| `GET` | `/api/customers` | List customers with outstanding balances |
| `GET` | `/api/customers/:id/summary` | Customer detail with invoices & payments |
| `GET` | `/api/customers/:id/credit` | Per-customer credit insight: risk level, overdue breakdown, days overdue, collection rate |
| `GET` | `/api/invoices` | All invoices with computed status |
| `POST` | `/api/invoices` | Create a manual invoice |
| `POST` | `/api/invoices/:id/pay` | Record a payment against an invoice |
| `GET` | `/api/invoices/overdue` | Overdue invoices (remaining > 0 only) |
| `GET` | `/api/insights/dashboard` | Aggregated financial dashboard metrics |

### Sync Response Format

```json
{
  "message": "Sync completed",
  "synced": { "customers": 3, "invoices": 5, "payments": 4 },
  "skipped": [
    { "type": "invoice", "id": "inv_999", "reason": "Customer cust_99 not found" }
  ],
  "errors": [
    { "type": "payment", "id": "pay_5", "reason": "Unique constraint failed" }
  ]
}
```

`skipped` and `errors` are only present when applicable. A single record failure does not abort the entire sync.

### Credit Insight Response Format

```json
{
  "customerId": 1,
  "name": "ABC Pvt Ltd",
  "email": "abc@gmail.com",
  "totalInvoiced": 8000,
  "totalPaid": 2000,
  "outstandingBalance": 6000,
  "totalOverdue": 3000,
  "collectionRate": 25,
  "riskLevel": "high",
  "overdueInvoices": [
    {
      "invoiceId": "inv_101",
      "amount": 5000,
      "remaining": 3000,
      "dueDate": "2024-03-20T00:00:00.000Z",
      "daysOverdue": 420
    }
  ]
}
```

`riskLevel` is `low` (no overdue), `medium` (overdue ≤ 30% of total invoiced), or `high` (overdue > 30%).

---

## Design Decisions

### External ID Strategy
The external API uses string IDs (`cust_1`, `inv_101`). Rather than using these as primary keys, the schema uses auto-increment integer PKs internally and stores the external ID in a separate `external_id` column with a `UNIQUE` constraint.

**Why:** Using external IDs as PKs would couple our relational integrity to a third-party system. If the external system changes its ID format or we switch providers, all FK references would break. Keeping internal PKs means our data model is stable regardless of what the external system does.

### Upsert on Sync
Every sync call uses Prisma's `upsert` (insert or update) rather than delete-and-reinsert.

**Why:** Delete-and-reinsert would destroy any manually created records (invoices/payments added via the UI) and would also break if the external API returns partial data during a network hiccup. Upsert is safe to run repeatedly — it only updates what changed.

### Computed vs Stored Status
Invoice status (`paid`, `overdue`, `pending`) is computed at query time rather than stored as a column.

**Why:** Storing status creates a consistency problem — every time a payment is recorded, you'd need to update the invoice status too. If that update fails or is missed, the status becomes stale. Computing it from `remaining > 0` and `dueDate < now` is always accurate and requires no maintenance.

### Remaining Balance
`remaining = amount - sum(payments)` is always computed, never stored.

**Why:** Same reasoning as status — storing a derived value creates two sources of truth. With partial payments, you'd need to update the stored balance on every payment. Computing it at read time is simpler and always correct.

### Parallel Fetch on Sync
`Promise.all` is used to fetch customers, invoices, and payments simultaneously.

**Why:** Sequential fetches would take 3x longer. Since the three endpoints are independent, parallel fetching is safe and significantly reduces sync latency.

### Route Ordering (Express)
`GET /invoices/overdue` is registered before `POST /invoices/:id/pay`.

**Why:** Express matches routes in registration order. If `/:id` were registered first, the string `"overdue"` would be captured as an ID parameter, causing the wrong handler to run. This is a subtle but critical ordering constraint.

### Single Prisma Client (`db.js`)
A single `PrismaClient` instance is exported from `db.js` and shared across all route files.

**Why:** Each `PrismaClient` instance opens its own connection pool. Instantiating it per-request or per-file would exhaust database connections quickly. One shared instance is the correct pattern for Node.js applications.

### Separation of Responsibilities
Each route file has a single concern: `sync.js` owns the integration layer, `customers.js` and `invoices.js` own domain reads/writes, and `insights.js` owns analytics aggregation.

**Why:** Mixing concerns (e.g. putting sync logic inside the customer route) makes the code harder to test, reason about, and extend. If the external API changes, only `sync.js` needs to change — nothing else is affected.

### Database Schema

```
Customer → Invoice (one-to-many)
Invoice  → Payment (one-to-many)
```

Each model stores an `external_id` for idempotent sync and an internal `id` for relational integrity. The `createdAt` timestamp on Customer enables future audit and ordering capabilities.

---

## Edge Cases Handled

| Case | How it's handled |
|------|-----------------|
| External API unreachable | Returns `502 Bad Gateway` with error detail immediately |
| Missing required fields in sync payload | Record is skipped with reason logged in response |
| Orphaned invoice (customer not in DB) | Skipped with `"Customer X not found"` in skipped list |
| Orphaned payment (invoice not in DB) | Skipped with `"Invoice X not found"` in skipped list |
| Invalid date format from external API | Skipped with reason, does not crash sync |
| Zero or negative payment amount | Skipped with reason |
| Per-record DB error during sync | Logged in `errors[]`, rest of sync continues |
| Overpayment attempt | Rejected server-side with `400` and remaining balance in message |
| Duplicate sync | Upsert ensures full idempotency, no duplicate records |
| Fully paid invoice appearing as overdue | Overdue filter checks `remaining > 0`, not just `dueDate < now` |
| Manual records surviving re-sync | `manual_` prefixed external IDs are never matched by external data |

---

## Assumptions

Since the external accounting API was not provided as part of the assessment, a mock API (`mockApi.js`) was built to simulate it. The following assumptions were made about the external system's contract:

### External API Shape

| Endpoint | Response shape assumed |
|----------|------------------------|
| `GET /customers` | `[{ id, name, email }]` |
| `GET /invoices` | `[{ id, customer_id, amount, due_date }]` |
| `GET /payments` | `[{ id, invoice_id, amount, payment_date }]` |

### Field-level Assumptions
- `id` fields are strings (e.g. `cust_1`, `inv_101`, `pay_1`) — not integers
- `due_date` and `payment_date` are ISO 8601 date strings (`YYYY-MM-DD`)
- `amount` is a positive number (integer or float)
- A payment references an invoice via `invoice_id`, not a customer directly
- A single invoice can have multiple partial payments
- The external API has no authentication — assumed to be internal/trusted
- The external API returns all records in a single response (no pagination)

### Business Logic Assumptions
- An invoice is considered **overdue** only if `dueDate < today AND remaining > 0` — a fully paid invoice is never overdue even if its due date has passed
- **Remaining balance** = `invoice.amount - sum(payments)` — partial payments are supported
- **Risk level** is classified as: `low` (no overdue), `medium` (overdue ≤ 30% of total invoiced), `high` (overdue > 30%) — thresholds chosen as a reasonable starting point and can be made configurable
- Re-running sync is safe — the service is designed to be idempotent by default
- Manually created invoices/payments (via the UI) should survive a re-sync — achieved via `manual_` prefixed external IDs

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Backend | Node.js + Express | Lightweight, fast to set up for integration services |
| ORM | Prisma | Type-safe queries, clean migrations, easy upsert support |
| Database | PostgreSQL | Relational integrity for customer→invoice→payment hierarchy |
| Frontend | React + Vite | Fast dev experience, component-based UI |
| HTTP Client | Axios | Promise-based, clean error handling for external API calls |
| Charts | Recharts | Composable chart library for React |
| PDF Receipt | Browser Print API | Zero dependency, works natively in all browsers |
