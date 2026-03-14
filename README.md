# PaySaathi — Integration Service

A receivables management service that integrates with an external accounting API, stores data locally, and exposes financial insights via a REST API and dashboard UI.

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL (running locally )

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

---

## Design Decisions

### External ID Strategy
The external API uses string IDs (`cust_1`, `inv_101`). Rather than using these as primary keys, the schema uses auto-increment integer PKs internally and stores the external ID in a separate `external_id` column with a `UNIQUE` constraint. This allows safe upserts on sync without coupling internal references to external system IDs.

### Upsert on Sync
Every sync call uses Prisma's `upsert` (insert or update) rather than delete-and-reinsert. This preserves any manually created records (invoices/payments added via the UI) and avoids data loss if the external API is temporarily inconsistent.

### Computed vs Stored Status
Invoice status (`paid`, `overdue`, `pending`) is **computed at query time** rather than stored as a column. This avoids stale status values — a payment recorded at any time will immediately reflect the correct status on the next read. The `status` column in the schema is kept for future use (e.g. manual overrides).

### Remaining Balance
`remaining = amount - sum(payments)` is always computed, never stored. This ensures consistency even when multiple partial payments exist.

### Route Ordering (Express)
`GET /invoices/overdue` is registered **before** `POST /invoices/:id/pay` to prevent Express from matching the string `"overdue"` as an `:id` parameter.

### Separation of Responsibilities
```
src/
  mockApi.js       — simulates the external accounting system
  server.js        — app entry point, middleware, route mounting
  db.js            — single Prisma client instance
  routes/
    sync.js        — integration layer: fetches & upserts external data
    customers.js   — customer read endpoints
    invoices.js    — invoice CRUD + payment recording
    insights.js    — aggregated financial analytics
```

### Database Schema
Three models mirror the external system's domain:

```
Customer → Invoice (one-to-many)
Invoice  → Payment (one-to-many)
```

Each model stores an `external_id` for idempotent sync and an internal `id` for relational integrity.

### Edge Cases Handled
- **Overpayment blocked** — payment amount validated against remaining balance server-side
- **Missing customer/invoice** — sync skips orphaned records gracefully with `continue`
- **Fully paid invoices excluded from overdue** — overdue filter checks `remaining > 0`, not just `dueDate < now`
- **Duplicate sync** — upsert ensures re-running sync is idempotent
- **Manual records preserved** — manually created invoices/payments use `manual_` prefixed external IDs and survive re-sync

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

---

## Screenshots

> Dashboard with financial overview, monthly collections chart, and invoice status breakdown.
> Customer cards with collection progress and outstanding balance.
> Invoice management with Pay modal and downloadable receipts.
