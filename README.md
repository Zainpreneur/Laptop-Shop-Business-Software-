# 💻 Laptop Shop Business Software

A full-stack business management system for a laptop retail & repair shop:
inventory, point-of-sale, customers, suppliers, purchase orders, repair
tickets, and a reporting dashboard — with role-based access for Admins and
Staff.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite (file-based,
  zero external DB setup), JWT auth, Zod validation
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router,
  Recharts, Axios

## Features

- **Auth & Roles** — JWT login, Admin vs. Staff permissions
- **Inventory** — laptops with brand/category/specs, cost & selling price,
  stock levels, low-stock alerts
- **Sales / POS** — cart-based checkout, auto stock decrement, invoices,
  discounts/tax, payment methods, sale cancellation (restocks)
- **Customers** — customer records with purchase & repair history
- **Suppliers & Purchase Orders** — order stock from suppliers; receiving a
  PO increases inventory automatically
- **Repair Tickets** — track devices in for service: status, technician,
  estimated/final cost, notes
- **Dashboard & Reports** — daily/monthly revenue, 30-day profit estimate,
  inventory valuation, low-stock list, top-selling products, sales trend
  chart
- **User Management** — Admins can create/disable staff & admin accounts

## Project Structure

```
backend/    Express + Prisma API (TypeScript)
frontend/   React + Vite SPA (TypeScript)
```

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init   # creates SQLite DB + applies schema + seeds demo data
npm run dev                          # starts API on http://localhost:4000
```

Demo accounts created by the seed script:

| Role  | Email                   | Password  |
|-------|-------------------------|-----------|
| Admin | admin@laptopshop.com    | Admin@123 |
| Staff | staff@laptopshop.com    | Staff@123 |

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # starts app on http://localhost:5173
```

Open http://localhost:5173 and log in with one of the demo accounts above.

## Backend Scripts

| Command                    | Description                              |
|-----------------------------|-------------------------------------------|
| `npm run dev`               | Start API with hot reload (tsx)          |
| `npm run build`             | Compile TypeScript to `dist/`            |
| `npm start`                 | Run compiled server                      |
| `npx prisma migrate dev`    | Apply schema changes to the DB           |
| `npm run seed`              | Re-run the demo data seed script         |

## Frontend Scripts

| Command         | Description                    |
|------------------|---------------------------------|
| `npm run dev`    | Start Vite dev server           |
| `npm run build`  | Type-check and build for production |
| `npm run preview`| Preview the production build    |

## Roles & Permissions

- **Admin**: full access — manage inventory, suppliers, purchase orders,
  users, cancel sales, delete records.
- **Staff**: day-to-day operations — ring up sales, manage customers, log
  repair tickets, view inventory/dashboard. Cannot manage users, suppliers,
  purchase orders, or delete inventory.

## Notes

- The database is SQLite by default (`backend/prisma/dev.db`), so there's
  nothing to provision to run this locally. To move to PostgreSQL/MySQL for
  production, change the `datasource` provider in
  `backend/prisma/schema.prisma` and update `DATABASE_URL`.
- All monetary figures are stored as plain numbers (no currency symbol) —
  the UI formats them as USD (`$`); adjust `money()` in
  `frontend/src/components/ui.tsx` for a different currency.
