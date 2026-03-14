# PaySaathi — Integration Service

A receivables management service that integrates with an external accounting API, stores data locally, and exposes financial insights via a REST API and dashboard UI.

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
# Terminal 1 — Mock external API (port 4000)
cd backend
node src/mockApi.js

# Terminal 2 — Integration backend (port 3000)
node src/server.js

# Terminal 3 — Frontend dashboard (port 5173)
cd frontend
npm run dev
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

---

## Design Decisions

### External ID Strategy
The external API uses string IDs (`cust_1`, `inv_101`). Rather than using these as primary keys, the schema uses auto-increment integer PKs internally and stores the external ID in a separate `external_id` column with a `UNIQUE` constraint. This decouples internal relational integrity from the external system's ID format and allows safe upserts without risk of collision.

### Upsert on Sync
Every sync call uses Prisma's `upsert` (insert or update) rather than delete-and-reinsert. This preserves any manually created records and avoids data loss if the external API is temporarily inconsistent or returns partial data.

### Computed vs Stored Status
Invoice status (`paid`, `overdue`, `pending`) is computed at query time rather than stored as a column. This avoids stale status values — a payment recorded at any time immediately reflects the correct status on the next read. The `status` column in the schema is retained for future use such as manual overrides.

### Remaining Balance
`remaining = amount - sum(payments)` is always computed, never stored. This ensures consistency even when multiple partial payments exist against a single invoice.

### Route Ordering (Express)
`GET /invoices/overdue` is registered before `/:id` routes to prevent Express from matching the string `"overdue"` as an `:id` parameter — a subtle but critical ordering issue.

### Separation of Responsibilities
Each route file has a single concern: `sync.js` owns the integration layer, `customers.js` and `invoices.js` own domain reads/writes, and `insights.js` owns analytics aggregation. `db.js` exports a single shared Prisma client to avoid multiple connection pool instances.

### Database Schema

```
Customer → Invoice (one-to-many)
Invoice  → Payment (one-to-many)
```

Each model stores an `external_id` for idempotent sync and an internal `id` for relational integrity.

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
