# NextERP — Progress Tracker

> Auto-updated as development progresses. See [BRIEF.md](./BRIEF.md) for the full specification.

---

## Phase 0 — Foundation (Platform Layer)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Project scaffolding (Next.js 16, Tailwind v4, shadcn/ui) | ✅ Done | New York style, 28 UI components installed |
| 2 | Database schema — core tables | ✅ Done | companies, users, userCompanies, roles, permissions, rolePermissions, userRoles, sessions, accounts, verificationTokens, auditLogs, sequences, notifications, attachments, moduleDefinitions, companyModules |
| 3 | Drizzle ORM + PostgreSQL client | ✅ Done | `lib/db/index.ts`, `drizzle.config.ts` |
| 4 | Shared types & module registry | ✅ Done | 20 modules defined, error classes, API types |
| 5 | Auth system (NextAuth v5 / Auth.js) | ✅ Done | JWT strategy, Credentials provider, login/register |
| 6 | Registration flow | ✅ Done | Creates user + company + admin role + core modules + default sequences |
| 7 | Middleware (route protection) | ✅ Done | Protects `/dashboard/**`, allows public auth routes |
| 8 | RBAC service | ✅ Done | `checkPermission`, `getUserPermissions`, `getCompanyModules`, `isModuleEnabled` |
| 9 | Main ERP layout + sidebar | ✅ Done | Module-filtered navigation, company switcher, user dropdown |
| 10 | Navigation config | ✅ Done | Full sidebar nav for all 20 modules |
| 11 | Company switching | ✅ Done | `switchCompanyAction` — multi-company support |
| 12 | Dashboard page | ✅ Done | Module-aware stat cards, quick actions |
| 13 | Settings — Company profile | ✅ Done | Name, email, phone, address, currency, timezone |
| 14 | Settings — User management | ✅ Done | List users, add user, remove user, role assignment |
| 15 | Settings — Roles & permissions | ✅ Done | Create/delete roles, member count |
| 16 | Settings — Module management | ✅ Done | Toggle modules on/off per company, dependency checks |
| 17 | DB migrations | ✅ Done | 3 migrations generated (41 tables total) |

---

## Phase 1 — Core Business Modules

| # | Module | Status | Notes |
|---|--------|--------|-------|
| 1 | Contacts (People & Organizations) | ✅ Done | Schema (contacts, contactAddresses, contactBankAccounts), full CRUD, list/detail/new/edit pages |
| 2 | Inventory (Products & Stock) | ✅ Done | Schema (products, categories, warehouses, stockLevels, stockMoves, UoM), products CRUD, categories/warehouses management |
| 3 | Sales (Quotations & Orders) | ✅ Done | Schema (salesOrders, salesOrderLines, quotations, invoices, payments), orders CRUD with line items, order detail with status workflow, quotations/invoices/payments placeholders |
| 4 | Purchase (POs & Vendor Bills) | ✅ Done | Schema (purchaseOrders, purchaseOrderLines, vendorBills, vendorBillLines, vendorPayments), POs CRUD with line items, PO detail with status workflow, bills/payments placeholders |
| 5 | Accounting (Chart of Accounts, Journals) | ✅ Done | Schema (accounts, journalEntries, journalEntryLines, taxRates, fiscalYears), chart of accounts CRUD, journal entries with balanced double-entry, tax rates, fiscal years |

---

## Phase 2 — Extended Modules

| # | Module | Status | Notes |
|---|--------|--------|-------|
| 1 | CRM (Leads & Pipeline) | 🔲 Pending | |
| 2 | Warehouse (Picking, Packing, Shipping) | 🔲 Pending | |
| 3 | Manufacturing (BOM, Production) | 🔲 Pending | |
| 4 | POS (Point of Sale) | 🔲 Pending | |
| 5 | HR (Employees, Leave, Payroll) | 🔲 Pending | |
| 6 | Projects (Tasks, Gantt, Timesheets) | 🔲 Pending | |
| 7 | Helpdesk (Tickets, SLA) | 🔲 Pending | |
| 8 | Quality Control | 🔲 Pending | |
| 9 | Assets (Fixed Asset Tracking) | 🔲 Pending | |
| 10 | Maintenance | 🔲 Pending | |
| 11 | Fleet | 🔲 Pending | |
| 12 | Documents (DMS) | 🔲 Pending | |
| 13 | Reports (BI & Dashboards) | 🔲 Pending | |
| 14 | Subscriptions (Recurring Billing) | 🔲 Pending | |

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Day 1 | Shared-DB multi-tenancy with `company_id` | Simpler ops, good enough for SaaS scale |
| Day 1 | JWT session strategy (not DB sessions) | Lower latency, stateless API calls |
| Day 1 | Module registry in code + DB toggle | Modules defined in code, enabled/disabled per company in DB |
| Day 1 | Drizzle ORM over Prisma | Better performance, SQL-first approach |

---

## File Structure (created so far)

```
lib/
  db/
    index.ts              — Postgres client + Drizzle instance
    schema/
      core.ts             — Core tables (companies, users, roles, modules, etc.)
      contacts.ts         — Contacts, addresses, bank accounts
      inventory.ts        — Products, categories, warehouses, stock
      sales.ts            — Sales orders, quotations, invoices, payments
      purchase.ts         — Purchase orders, vendor bills, vendor payments
      accounting.ts       — Chart of accounts, journal entries, tax rates, fiscal years
      index.ts            — Re-exports all schemas
    migrations/
      0000_flat_nitro.sql
      0001_high_cardiac.sql
      0002_round_grey_gargoyle.sql
  types.ts                — Module registry, error classes, shared types
  auth.ts                 — NextAuth configuration
  session.ts              — Session helpers
  utils.ts                — cn() utility
  services/
    rbac.service.ts       — Permission checking
  actions/
    company.actions.ts    — Company switching
  config/
    navigation.ts         — Sidebar navigation config

app/
  (auth)/
    layout.tsx            — Centered auth layout
    actions.ts            — Login, register, logout server actions
    login/page.tsx        — Login form
    register/page.tsx     — Registration form
  (erp)/
    layout.tsx            — Main ERP layout (sidebar + topbar)
    dashboard/page.tsx    — Dashboard with module-aware cards
    settings/
      page.tsx, layout.tsx, actions.ts
      company/            — Company profile form
      users/              — User management + invite
      roles/              — Role management
      modules/            — Module toggle cards
    contacts/
      actions.ts          — Contacts CRUD server actions
      page.tsx            — Contacts list (server)
      contacts-client.tsx — Contacts table (client)
      contact-form.tsx    — Reusable create/edit form
      new/page.tsx        — New contact
      [id]/page.tsx       — Contact detail
      [id]/edit/page.tsx  — Edit contact
    inventory/
      actions.ts          — Products, categories, warehouses, stock moves
      page.tsx, layout.tsx — Tab navigation
      products/           — Products CRUD + detail
      categories/         — Category management
      warehouses/         — Warehouse management
      stock-moves/        — Stock moves placeholder
    sales/
      actions.ts          — Sales orders, sequence helper
      page.tsx, layout.tsx — Tab navigation
      orders/             — Orders CRUD + detail + status actions
      quotations/         — Placeholder
      invoices/           — Placeholder
      payments/           — Placeholder
    purchase/
      actions.ts          — Purchase orders, vendor contacts
      page.tsx, layout.tsx — Tab navigation
      orders/             — POs CRUD + detail + status actions
      bills/              — Placeholder
      payments/           — Placeholder
    accounting/
      actions.ts          — Accounts, journal entries, tax rates, fiscal years
      page.tsx, layout.tsx — Tab navigation
      accounts/           — Chart of accounts CRUD
      journal/            — Journal entries CRUD + balanced posting
      taxes/              — Tax rate management
      fiscal-years/       — Fiscal year management

components/
  layout/
    app-sidebar.tsx       — Sidebar with company switcher
    top-bar.tsx           — Top bar with breadcrumbs
  shared/
    page-header.tsx       — Reusable page header
    empty-state.tsx       — Empty state placeholder
    stat-card.tsx         — Dashboard stat card
  ui/                     — 28 shadcn/ui components
```
