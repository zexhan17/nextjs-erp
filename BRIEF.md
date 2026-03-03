# NextJS ERP — Full Enterprise Resource Planning System

## Project Brief & Architecture Specification

**Version:** 1.0.0
**Date:** 2026-03-03
**Codename:** NextERP
**Comparable To:** Odoo, ERPNext, SAP Business One, Microsoft Dynamics 365

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [Target Customers](#2-target-customers)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Core Platform Layer](#5-core-platform-layer)
6. [Module Index](#6-module-index)
7. [Module Deep Dives](#7-module-deep-dives)
8. [Cross-Module Features](#8-cross-module-features)
9. [Data Models & Relationships](#9-data-models--relationships)
10. [API Design](#10-api-design)
11. [Multi-Tenancy & SaaS Architecture](#11-multi-tenancy--saas-architecture)
12. [Role-Based Access Control (RBAC)](#12-role-based-access-control-rbac)
13. [UI/UX Design System](#13-uiux-design-system)
14. [File & Folder Structure](#14-file--folder-structure)
15. [Implementation Order](#15-implementation-order)
16. [Common vs Industry-Specific Features](#16-common-vs-industry-specific-features)
17. [Integration & Extensibility](#17-integration--extensibility)
18. [Testing Strategy](#18-testing-strategy)
19. [Deployment & DevOps](#19-deployment--devops)
20. [Conventions & Rules for AI Agents](#20-conventions--rules-for-ai-agents)

---

## 1. Vision & Goals

Build a **complete, modular, enterprise-grade ERP system** that can be sold to:
- A garment/cloth trading business
- A manufacturing/production factory
- A retail shop (single or chain)
- A restaurant or food service business
- A wholesale distributor
- Any small-to-large business needing resource planning

The system must be:
- **Modular** — each module is independently toggleable per tenant/company
- **Multi-tenant** — one deployment, many companies (SaaS-ready)
- **Multi-currency & multi-language** ready
- **Role-based** — granular permissions down to field level
- **Audit-logged** — every write operation tracked
- **Offline-capable** — critical POS/operations work offline via service workers
- **API-first** — every feature accessible via REST + optional GraphQL
- **Extensible** — custom fields, custom modules, webhooks, plugins
- **Production-ready** — proper error handling, logging, monitoring
- **Beautiful** — modern dashboard UI using shadcn components

---

## 2. Target Customers

| Customer Type | Key Modules They Use |
|---|---|
| Cloth Trading Business | Inventory, Sales, Purchase, Accounting, CRM, Contacts, Warehouse |
| Production/Manufacturing Factory | Manufacturing, BOM, Quality, Inventory, Purchase, Sales, HR, Maintenance, Accounting |
| Retail Shop | POS, Inventory, Sales, Purchase, Accounting, CRM, Loyalty |
| Restaurant | POS (table-based), Inventory (recipe/ingredient), Kitchen Display, Sales, Purchase, Accounting |
| Wholesale Distributor | Inventory, Sales, Purchase, Warehouse, Logistics, Accounting, CRM |
| Service Business | Projects, Timesheets, HR, Invoicing, CRM, Helpdesk |

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router, RSC) | Full-stack React, SSR, API routes |
| **Language** | TypeScript (strict mode) | Type safety across entire codebase |
| **UI Components** | shadcn/ui (New York style) + Radix UI + Lucide icons | Already installed, enterprise-grade components |
| **Styling** | Tailwind CSS v4 | Utility-first, fast iteration |
| **Database** | PostgreSQL (via Supabase or self-hosted) | Relational, JSONB for flexibility, full-text search |
| **ORM** | Drizzle ORM | Type-safe, edge-compatible, SQL-like |
| **Authentication** | NextAuth.js v5 (Auth.js) | Credentials + OAuth + 2FA |
| **State Management** | Zustand (client) + React Server Components (server) | Minimal boilerplate, works with RSC |
| **Forms** | React Hook Form + Zod | Validation shared between client & server |
| **Tables** | TanStack Table v8 | Sorting, filtering, pagination, column visibility |
| **Charts** | Recharts or Tremor | Dashboard analytics |
| **Real-time** | Server-Sent Events (SSE) or WebSockets | Notifications, live dashboards, POS sync |
| **File Storage** | S3-compatible (MinIO / AWS S3 / Supabase Storage) | Attachments, documents, images |
| **PDF Generation** | @react-pdf/renderer or Puppeteer | Invoices, reports, labels |
| **Email** | Resend or Nodemailer | Transactional emails |
| **Job Queue** | BullMQ + Redis | Background jobs, scheduled reports, imports |
| **Search** | PostgreSQL full-text search (upgrade to Meilisearch if needed) | Fast product/document search |
| **Caching** | Redis | Session, query cache, rate limiting |
| **Testing** | Vitest + Playwright | Unit + E2E |
| **Monorepo** | Turborepo (optional, future) | If we split into packages |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER / CLIENT                       │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────────┐  │
│  │ Dashboard│ │  Module  │ │   POS   │ │  Kitchen Display│  │
│  │   Pages  │ │  Pages   │ │  (PWA)  │ │     (PWA)       │  │
│  └────┬─────┘ └────┬─────┘ └────┬────┘ └────────┬────────┘  │
│       │             │            │                │           │
│  ┌────▼─────────────▼────────────▼────────────────▼────────┐ │
│  │              Zustand Stores (Client State)              │ │
│  └────┬────────────────────────────────────────────────────┘ │
└───────┼─────────────────────────────────────────────────────┘
        │ HTTP / SSE / WebSocket
┌───────▼─────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Layer (Route Handlers)               │   │
│  │         /api/v1/[module]/[resource]/[action]          │   │
│  └──────────┬───────────────────────────────────────────┘   │
│             │                                                │
│  ┌──────────▼───────────────────────────────────────────┐   │
│  │              Service Layer (Business Logic)           │   │
│  │    Each module has its own service with clear API     │   │
│  └──────────┬───────────────────────────────────────────┘   │
│             │                                                │
│  ┌──────────▼──────────────────────────────────────────┐    │
│  │           Core Platform Services                     │    │
│  │  ┌─────────┐ ┌──────┐ ┌──────┐ ┌───────┐ ┌──────┐  │    │
│  │  │  Auth   │ │ RBAC │ │Audit │ │Tenant │ │Queue │  │    │
│  │  │ Service │ │Engine│ │ Log  │ │Manager│ │Worker│  │    │
│  │  └─────────┘ └──────┘ └──────┘ └───────┘ └──────┘  │    │
│  └──────────┬──────────────────────────────────────────┘    │
│             │                                                │
│  ┌──────────▼──────────────────────────────────────────┐    │
│  │             Data Access Layer (Drizzle ORM)          │    │
│  │         Repository pattern per module                │    │
│  └──────────┬──────────────────────────────────────────┘    │
└─────────────┼────────────────────────────────────────────────┘
              │
┌─────────────▼────────────────────────────────────────────────┐
│                     DATA STORES                               │
│  ┌──────────────┐  ┌───────────┐  ┌────────────────────┐    │
│  │  PostgreSQL   │  │   Redis   │  │  S3 / File Storage │    │
│  │  (Primary DB) │  │  (Cache)  │  │   (Attachments)    │    │
│  └──────────────┘  └───────────┘  └────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Action → React Component → (Client: Zustand action | Server: Server Action)
  → API Route Handler (validates auth + permissions)
    → Service Layer (business logic, cross-module orchestration)
      → Repository Layer (Drizzle queries)
        → PostgreSQL
      ← Return data
    ← Apply business rules / transformations
  ← Return JSON response
← Update UI (optimistic updates where appropriate)
```

---

## 5. Core Platform Layer

These are NOT modules — they are **platform services** that every module depends on.

### 5.1 Authentication & Session Management
- Email/password login with bcrypt hashing
- OAuth providers (Google, Microsoft, GitHub)
- Two-Factor Authentication (TOTP + SMS)
- Session management with JWT + refresh tokens stored in httpOnly cookies
- Password reset flow, email verification
- Login history & device management
- Account lockout after failed attempts

### 5.2 Multi-Tenancy (Company/Organization)
- Each tenant = one company/organization
- `company_id` foreign key on EVERY business table
- Tenant-level settings: currency, timezone, fiscal year, language
- Tenant isolation enforced at query level (Drizzle middleware)
- Tenant switching for users who belong to multiple companies
- Subdomain or path-based routing per tenant

### 5.3 Role-Based Access Control (RBAC)
- **Roles**: Super Admin, Admin, Manager, User, Custom roles
- **Permissions**: Module-level + Resource-level + Field-level
- Permission format: `module:resource:action` (e.g., `inventory:product:delete`)
- Actions: `create`, `read`, `read_own`, `update`, `update_own`, `delete`, `export`, `import`, `approve`
- Role inheritance (Manager inherits User permissions)
- Row-level security for sensitive data (e.g., see only own department's data)
- Permission caching in Redis (invalidate on role change)

### 5.4 Audit Log
- Every CREATE, UPDATE, DELETE logged automatically
- Fields: `who`, `what`, `when`, `old_value`, `new_value`, `ip_address`, `user_agent`
- Implemented via Drizzle hooks/middleware — zero effort for module developers
- Queryable audit trail per record, per user, per module
- Retention policy (configurable per tenant)

### 5.5 Notification System
- In-app notifications (bell icon, real-time via SSE)
- Email notifications (configurable per event type)
- SMS notifications (optional, via Twilio/similar)
- WhatsApp notifications (optional, via WhatsApp Business API)
- Notification preferences per user
- Notification templates (customizable per tenant)
- Event-driven: modules emit events, notification service listens

### 5.6 File/Attachment Manager
- Upload files to S3-compatible storage
- Attach files to any record (polymorphic: `attachable_type` + `attachable_id`)
- Image resizing/thumbnails on upload
- Virus scanning (optional, via ClamAV)
- File versioning
- Access control (inherits parent record permissions)

### 5.7 Settings Engine
- Global settings (system-wide)
- Company settings (per tenant)
- User settings (personal preferences)
- Module settings (per module per tenant)
- Settings stored as key-value with type info in DB
- Settings UI auto-generated from schema

### 5.8 Custom Fields Engine
- Any module can have user-defined custom fields
- Field types: text, number, date, select, multi-select, checkbox, file, relation
- Custom fields stored in JSONB column on each table
- Custom fields appear in forms, lists, filters, exports
- Defined per tenant (each company can have different custom fields)

### 5.9 Import/Export Engine
- CSV/XLSX import with column mapping UI
- CSV/XLSX/PDF export for any list view
- Import validation with error report
- Background processing for large imports (via BullMQ)
- Import templates (downloadable)
- Scheduled exports (e.g., daily inventory report via email)

### 5.10 Workflow/Approval Engine
- Define approval workflows for any document type
- Multi-level approvals (e.g., Purchase Order > $10K needs Director approval)
- Parallel and sequential approval steps
- Auto-approve rules
- Escalation on timeout
- Email/notification on pending approvals

### 5.11 Print/PDF Engine
- PDF generation for invoices, POs, receipts, reports
- Customizable templates per document type per tenant
- Barcode/QR code generation
- Thermal printer support (for POS receipts)
- Batch printing

### 5.12 Scheduled Jobs / Cron
- BullMQ-based job queue
- Recurring jobs: daily closing, report generation, reminders
- One-off jobs: large imports, bulk emails
- Job monitoring dashboard (admin only)
- Retry with exponential backoff

### 5.13 Activity / Timeline
- Every record has an activity timeline
- Comments, status changes, file uploads, emails — all in one stream
- @mentions in comments
- Internal notes vs. external-facing comments

### 5.14 Search
- Global search across all modules (Cmd+K)
- Full-text search via PostgreSQL `tsvector`
- Search results grouped by module
- Recent searches, saved searches
- Advanced filter builder (field + operator + value)

### 5.15 Dashboard Engine
- Configurable dashboard per role per module
- Widget types: KPI card, chart, table, calendar, activity feed
- Drag-and-drop layout
- Real-time data refresh
- Dashboard sharing

---

## 6. Module Index

| # | Module | Code | Description |
|---|--------|------|-------------|
| 1 | **Contacts** | `contacts` | People & organizations (customers, vendors, employees) |
| 2 | **CRM** | `crm` | Leads, opportunities, pipeline, activities |
| 3 | **Sales** | `sales` | Quotations, sales orders, invoicing |
| 4 | **Purchase** | `purchase` | Purchase requests, RFQs, purchase orders, vendor bills |
| 5 | **Inventory** | `inventory` | Products, stock, warehouses, stock moves |
| 6 | **Warehouse** | `warehouse` | Advanced warehouse ops: locations, picking, packing, shipping |
| 7 | **Manufacturing** | `manufacturing` | BOM, work orders, production planning, shop floor |
| 8 | **Quality Control** | `quality` | Inspections, quality checks, non-conformance |
| 9 | **Accounting** | `accounting` | Chart of accounts, journal entries, GL, AP, AR, reconciliation |
| 10 | **Point of Sale** | `pos` | Retail POS, restaurant POS, payment processing |
| 11 | **Human Resources** | `hr` | Employees, departments, attendance, leave, payroll |
| 12 | **Project Management** | `projects` | Projects, tasks, Gantt, Kanban, timesheets |
| 13 | **Helpdesk** | `helpdesk` | Tickets, SLA, knowledge base |
| 14 | **Assets** | `assets` | Fixed asset tracking, depreciation, maintenance scheduling |
| 15 | **Maintenance** | `maintenance` | Equipment, preventive/corrective maintenance, work orders |
| 16 | **Fleet** | `fleet` | Vehicle management, fuel, maintenance, assignments |
| 17 | **Documents** | `documents` | Document management, versioning, sharing |
| 18 | **Reports** | `reports` | Report builder, scheduled reports, analytics |
| 19 | **Settings** | `settings` | System settings, company setup, user management |
| 20 | **Subscriptions** | `subscriptions` | Recurring invoices, subscription plans, MRR tracking |

---

## 7. Module Deep Dives

### 7.1 Contacts Module (`contacts`)

**Purpose:** Central registry of all people and organizations the business interacts with.

**Why it's separate:** Every module references contacts. A contact can be a customer, vendor, employee, or all three simultaneously.

#### Features
- **Contact Types**: Individual, Company (organization)
- **Contact Roles**: Customer, Vendor, Employee, Partner (tags, not exclusive)
- **Contact Details**: Multiple addresses (billing, shipping, HQ), phones, emails
- **Contact Hierarchy**: Parent company → child contacts (employees of that company)
- **Bank Accounts**: Store multiple bank details per contact (for payments)
- **Credit Limit**: Set credit limits for customers
- **Tax ID / VAT**: Tax identification numbers
- **Contact Groups / Tags**: Flexible categorization
- **Merge Contacts**: Deduplplication tool
- **Activity Log**: All interactions from CRM, Sales, Support in one timeline
- **Portal Access**: Contacts can log in to see their orders, invoices, tickets

#### Key Data Model
```
Contact {
  id: UUID
  company_id: UUID (tenant)
  type: enum('individual', 'company')
  name: string
  display_name: string
  email: string
  phone: string
  mobile: string
  website: string
  tax_id: string
  is_customer: boolean
  is_vendor: boolean
  is_employee: boolean
  parent_contact_id: UUID (nullable, links to parent company)
  credit_limit: decimal
  currency_id: UUID
  language: string
  notes: text
  avatar_url: string
  tags: string[]
  custom_fields: jsonb
  is_active: boolean
  created_by: UUID
  created_at: timestamp
  updated_at: timestamp
}

ContactAddress {
  id: UUID
  contact_id: UUID
  type: enum('billing', 'shipping', 'other')
  label: string
  street: string
  street2: string
  city: string
  state: string
  zip: string
  country_code: string
  is_default: boolean
}

ContactBankAccount {
  id: UUID
  contact_id: UUID
  bank_name: string
  account_holder: string
  account_number: string
  routing_number: string
  iban: string
  swift: string
  is_default: boolean
}
```

#### API Endpoints
```
GET    /api/v1/contacts                    — List (paginated, filterable, searchable)
POST   /api/v1/contacts                    — Create
GET    /api/v1/contacts/:id                — Get by ID
PUT    /api/v1/contacts/:id                — Update
DELETE /api/v1/contacts/:id                — Soft delete
POST   /api/v1/contacts/:id/merge          — Merge duplicate
GET    /api/v1/contacts/:id/addresses       — List addresses
POST   /api/v1/contacts/:id/addresses       — Add address
GET    /api/v1/contacts/:id/activities      — Activity timeline
GET    /api/v1/contacts/:id/transactions    — Cross-module transactions
POST   /api/v1/contacts/import              — Bulk import
GET    /api/v1/contacts/export              — Export
```

---

### 7.2 CRM Module (`crm`)

**Purpose:** Manage the sales pipeline from lead to customer conversion.

#### Features
- **Leads**: Capture leads from web forms, email, manual entry, imports
- **Lead Scoring**: Rule-based scoring (company size, industry, engagement)
- **Lead Assignment**: Auto-assign by round-robin, territory, or rules
- **Opportunities/Deals**: Convert leads to opportunities with expected revenue
- **Pipeline Stages**: Customizable Kanban pipeline (per sales team)
- **Activities**: Schedule calls, emails, meetings, tasks linked to leads/opportunities
- **Email Integration**: Send/receive emails within CRM (track opens, clicks)
- **Win/Loss Analysis**: Track why deals were won or lost
- **Sales Teams**: Group salespeople into teams with targets
- **Sales Forecasting**: Pipeline-based revenue forecasting
- **Campaigns**: Track marketing campaigns and their ROI
- **Web-to-Lead**: Embeddable forms that create leads automatically
- **Duplicate Detection**: Warn on potential duplicate leads

#### Key Data Model
```
Lead {
  id: UUID
  company_id: UUID
  contact_id: UUID (nullable — created on conversion)
  name: string
  email: string
  phone: string
  source: enum('web', 'email', 'phone', 'referral', 'campaign', 'import', 'other')
  campaign_id: UUID (nullable)
  assigned_to: UUID (user)
  sales_team_id: UUID
  score: integer
  status: enum('new', 'contacted', 'qualified', 'converted', 'lost')
  lost_reason: string
  notes: text
  expected_revenue: decimal
  tags: string[]
  custom_fields: jsonb
  converted_at: timestamp
  converted_opportunity_id: UUID (nullable)
  created_at: timestamp
  updated_at: timestamp
}

Opportunity {
  id: UUID
  company_id: UUID
  name: string
  contact_id: UUID
  lead_id: UUID (nullable)
  pipeline_id: UUID
  stage_id: UUID
  assigned_to: UUID
  sales_team_id: UUID
  expected_revenue: decimal
  probability: integer (0-100)
  expected_close_date: date
  actual_close_date: date
  status: enum('open', 'won', 'lost')
  lost_reason_id: UUID
  source: string
  notes: text
  tags: string[]
  custom_fields: jsonb
  created_at: timestamp
  updated_at: timestamp
}

Pipeline {
  id: UUID
  company_id: UUID
  name: string
  sales_team_id: UUID
  is_default: boolean
}

PipelineStage {
  id: UUID
  pipeline_id: UUID
  name: string
  probability: integer
  sequence: integer
  is_won: boolean
  is_lost: boolean
}

Activity {
  id: UUID
  company_id: UUID
  type: enum('call', 'email', 'meeting', 'task', 'note')
  subject: string
  description: text
  due_date: timestamp
  done_date: timestamp
  assigned_to: UUID
  related_type: string ('lead', 'opportunity', 'contact')
  related_id: UUID
  status: enum('planned', 'done', 'cancelled', 'overdue')
}
```

#### API Endpoints
```
GET    /api/v1/crm/leads                   — List leads
POST   /api/v1/crm/leads                   — Create lead
PUT    /api/v1/crm/leads/:id               — Update
POST   /api/v1/crm/leads/:id/convert       — Convert to opportunity + contact
GET    /api/v1/crm/opportunities            — List opportunities
POST   /api/v1/crm/opportunities            — Create opportunity
PUT    /api/v1/crm/opportunities/:id        — Update (including stage changes)
PUT    /api/v1/crm/opportunities/:id/won    — Mark as won
PUT    /api/v1/crm/opportunities/:id/lost   — Mark as lost
GET    /api/v1/crm/pipeline                 — Pipeline Kanban data
GET    /api/v1/crm/activities               — All activities
POST   /api/v1/crm/activities               — Create activity
GET    /api/v1/crm/dashboard                — CRM dashboard KPIs
GET    /api/v1/crm/forecast                 — Revenue forecast
```

---

### 7.3 Sales Module (`sales`)

**Purpose:** Manage the entire order-to-cash cycle: quotes → orders → delivery → invoicing.

#### Features
- **Quotations/Estimates**: Create and send professional quotes with PDF
- **Quotation Templates**: Reusable quote templates
- **Sales Orders**: Convert quotations to confirmed orders
- **Order Lines**: Products/services with qty, price, discount, tax
- **Price Lists**: Multiple price lists (wholesale, retail, VIP)
- **Discount Rules**: Automatic discounts based on quantity, customer group, date range
- **Tax Computation**: Automatic tax calculation based on product + location
- **Delivery Integration**: Auto-create delivery orders from sales orders
- **Invoicing**: Generate invoices from delivered quantities or order confirmation
- **Down Payments**: Partial payments / deposits
- **Returns / Credit Notes**: Handle returns with credit notes
- **Sales Analytics**: Revenue by product, customer, salesperson, region, period
- **Commission Tracking**: Calculate sales commissions per salesperson
- **Blanket Orders**: Framework agreements with periodic releases
- **Pro-forma Invoices**: Pre-shipment invoices for international trade

#### Key Data Model
```
SalesOrder {
  id: UUID
  company_id: UUID
  number: string (auto-generated: SO-2026-00001)
  type: enum('quotation', 'order')
  status: enum('draft', 'sent', 'confirmed', 'processing', 'done', 'cancelled')
  contact_id: UUID (customer)
  billing_address_id: UUID
  shipping_address_id: UUID
  salesperson_id: UUID
  sales_team_id: UUID
  opportunity_id: UUID (nullable, from CRM)
  price_list_id: UUID
  currency_id: UUID
  exchange_rate: decimal
  payment_term_id: UUID
  order_date: date
  validity_date: date (for quotations)
  delivery_date: date (expected)
  
  subtotal: decimal
  discount_total: decimal
  tax_total: decimal
  grand_total: decimal
  amount_paid: decimal
  amount_due: decimal
  
  notes: text
  internal_notes: text
  terms_and_conditions: text
  tags: string[]
  custom_fields: jsonb
  
  created_by: UUID
  confirmed_by: UUID
  confirmed_at: timestamp
  created_at: timestamp
  updated_at: timestamp
}

SalesOrderLine {
  id: UUID
  order_id: UUID
  sequence: integer
  product_id: UUID
  description: string
  quantity: decimal
  unit_id: UUID (UoM)
  unit_price: decimal
  discount_percent: decimal
  discount_amount: decimal
  tax_ids: UUID[]
  tax_amount: decimal
  subtotal: decimal
  total: decimal
  delivered_qty: decimal
  invoiced_qty: decimal
}

PriceList {
  id: UUID
  company_id: UUID
  name: string
  currency_id: UUID
  type: enum('fixed', 'percentage', 'formula')
  is_default: boolean
}

PriceListItem {
  id: UUID
  price_list_id: UUID
  product_id: UUID (nullable — for category-wide rules)
  product_category_id: UUID (nullable)
  min_quantity: decimal
  fixed_price: decimal
  percent_discount: decimal
  date_start: date
  date_end: date
}

PaymentTerm {
  id: UUID
  company_id: UUID
  name: string (e.g., "Net 30", "50% advance, 50% on delivery")
  lines: jsonb [{days: 0, percent: 50, type: 'advance'}, {days: 30, percent: 50, type: 'balance'}]
}
```

#### API Endpoints
```
GET    /api/v1/sales/orders                  — List all
POST   /api/v1/sales/orders                  — Create quotation
GET    /api/v1/sales/orders/:id              — Get detail
PUT    /api/v1/sales/orders/:id              — Update
POST   /api/v1/sales/orders/:id/confirm      — Confirm quotation → SO
POST   /api/v1/sales/orders/:id/cancel       — Cancel
POST   /api/v1/sales/orders/:id/duplicate    — Duplicate
POST   /api/v1/sales/orders/:id/invoice      — Generate invoice
POST   /api/v1/sales/orders/:id/delivery     — Generate delivery order
GET    /api/v1/sales/orders/:id/pdf          — Download PDF
POST   /api/v1/sales/orders/:id/send-email   — Email to customer
GET    /api/v1/sales/price-lists             — List price lists
POST   /api/v1/sales/price-lists             — Create
GET    /api/v1/sales/analytics               — Sales analytics
GET    /api/v1/sales/commissions             — Commission report
```

#### Module Interactions
- **CRM → Sales**: Opportunity won → auto-create quotation
- **Sales → Inventory**: Sales order confirmed → reserve stock, create delivery
- **Sales → Accounting**: Invoice generated → create journal entries (AR)
- **Sales → Manufacturing**: If product is "make-to-order" → create production order
- **Contacts → Sales**: Customer info, addresses, credit limits

---

### 7.4 Purchase Module (`purchase`)

**Purpose:** Manage procurement: requests → RFQs → purchase orders → receiving → vendor bills.

#### Features
- **Purchase Requests**: Internal requests for materials/supplies
- **Request for Quotation (RFQ)**: Send RFQs to multiple vendors
- **Vendor Comparison**: Compare RFQ responses side-by-side
- **Purchase Orders**: Create and track POs
- **Automatic Reordering**: Min/max stock rules trigger purchase orders
- **Vendor Management**: Preferred vendors per product, lead times, prices
- **Vendor Price Lists**: Track vendor pricing and terms
- **Goods Receipt**: Receive goods against PO with quantity verification
- **3-Way Match**: Match PO ↔ Receipt ↔ Vendor Bill before payment
- **Purchase Analytics**: Spending by vendor, product, department, period
- **Blanket Purchase Orders**: Long-term agreements with periodic releases
- **Purchase Approval Workflow**: Multi-level approval based on amount

#### Key Data Model
```
PurchaseOrder {
  id: UUID
  company_id: UUID
  number: string (PO-2026-00001)
  type: enum('rfq', 'order')
  status: enum('draft', 'sent', 'confirmed', 'received', 'billed', 'done', 'cancelled')
  vendor_id: UUID (contact)
  billing_address_id: UUID
  shipping_address_id: UUID (warehouse address)
  buyer_id: UUID
  warehouse_id: UUID
  currency_id: UUID
  exchange_rate: decimal
  payment_term_id: UUID
  order_date: date
  expected_date: date
  
  subtotal: decimal
  tax_total: decimal
  grand_total: decimal
  amount_billed: decimal
  
  approval_status: enum('pending', 'approved', 'rejected')
  approved_by: UUID
  approved_at: timestamp
  
  notes: text
  internal_notes: text
  tags: string[]
  custom_fields: jsonb
  created_at: timestamp
  updated_at: timestamp
}

PurchaseOrderLine {
  id: UUID
  order_id: UUID
  sequence: integer
  product_id: UUID
  description: string
  quantity: decimal
  unit_id: UUID
  unit_price: decimal
  tax_ids: UUID[]
  tax_amount: decimal
  subtotal: decimal
  total: decimal
  received_qty: decimal
  billed_qty: decimal
}

VendorProductInfo {
  id: UUID
  vendor_id: UUID
  product_id: UUID
  vendor_product_name: string
  vendor_product_code: string
  price: decimal
  currency_id: UUID
  min_order_qty: decimal
  lead_time_days: integer
  is_preferred: boolean
}

ReorderRule {
  id: UUID
  company_id: UUID
  product_id: UUID
  warehouse_id: UUID
  min_qty: decimal
  max_qty: decimal
  reorder_qty: decimal
  preferred_vendor_id: UUID
  is_active: boolean
}
```

#### Module Interactions
- **Inventory → Purchase**: Stock below minimum → auto-create purchase request
- **Purchase → Inventory**: Goods received → create stock receipt
- **Purchase → Accounting**: Vendor bill → create journal entries (AP)
- **Manufacturing → Purchase**: BOM components not in stock → create purchase request
- **Purchase → Quality**: Incoming inspections on received goods

---

### 7.5 Inventory Module (`inventory`)

**Purpose:** Track all products, stock levels, stock movements, and valuations.

#### Features
- **Product Types**: Stockable, Consumable, Service, Digital
- **Product Variants**: Size, Color, Material etc. with variant matrix
- **Categories**: Hierarchical product categories
- **Units of Measure (UoM)**: kg, pcs, m, L, box — with conversions
- **Barcodes**: EAN-13, Code-128, QR codes — multiple per product
- **Serial Numbers**: Individual tracking per unit
- **Lot/Batch Tracking**: Group tracking with expiry dates
- **Stock Moves**: Every physical movement is a stock move record
- **Stock Valuation**: FIFO, LIFO, Weighted Average, Standard Cost
- **Stock Adjustments**: Physical inventory counts, write-offs
- **Multi-Warehouse**: Track stock per warehouse per location
- **Stock Transfers**: Inter-warehouse transfers
- **Kitting / Bundling**: Sell bundles of products
- **Product Images**: Multiple images per product
- **Low Stock Alerts**: Configurable alerts per product per warehouse
- **Inventory Aging**: Track how long stock has been sitting

#### Key Data Model
```
Product {
  id: UUID
  company_id: UUID
  name: string
  slug: string
  sku: string (unique per company)
  barcode: string
  type: enum('stockable', 'consumable', 'service', 'digital')
  category_id: UUID
  brand_id: UUID (nullable)
  unit_id: UUID (default UoM)
  purchase_unit_id: UUID (UoM for purchase)
  sale_price: decimal
  cost_price: decimal
  weight: decimal
  weight_unit: string
  dimensions: jsonb {length, width, height, unit}
  
  is_active: boolean
  is_sellable: boolean
  is_purchasable: boolean
  
  track_inventory: boolean
  track_serial: boolean
  track_lot: boolean
  
  valuation_method: enum('fifo', 'lifo', 'average', 'standard')
  
  tax_ids: UUID[]
  purchase_tax_ids: UUID[]
  
  description: text
  internal_notes: text
  images: jsonb [{url, alt, is_primary, sequence}]
  tags: string[]
  custom_fields: jsonb
  
  has_variants: boolean
  
  created_at: timestamp
  updated_at: timestamp
}

ProductVariant {
  id: UUID
  product_id: UUID
  name: string
  sku: string
  barcode: string
  additional_price: decimal
  cost_price: decimal
  weight: decimal
  attributes: jsonb [{attribute: 'Color', value: 'Red'}, {attribute: 'Size', value: 'XL'}]
  is_active: boolean
}

ProductCategory {
  id: UUID
  company_id: UUID
  name: string
  parent_id: UUID (nullable)
  slug: string
  description: string
  path: string (materialized: "Clothing/Men/Shirts")
}

UnitOfMeasure {
  id: UUID
  company_id: UUID
  name: string
  symbol: string
  category: enum('unit', 'weight', 'volume', 'length', 'time')
  ratio: decimal (relative to base unit in category)
  is_base: boolean
}

Warehouse {
  id: UUID
  company_id: UUID
  name: string
  code: string
  address_id: UUID
  manager_id: UUID
  is_active: boolean
}

StockLocation {
  id: UUID
  warehouse_id: UUID
  name: string
  code: string (e.g., "A-01-02" = Aisle A, Rack 1, Shelf 2)
  parent_id: UUID (nullable)
  type: enum('internal', 'supplier', 'customer', 'production', 'transit', 'scrap')
  is_active: boolean
}

StockMove {
  id: UUID
  company_id: UUID
  reference: string
  product_id: UUID
  variant_id: UUID (nullable)
  quantity: decimal
  unit_id: UUID
  source_location_id: UUID
  destination_location_id: UUID
  lot_id: UUID (nullable)
  serial_number: string (nullable)
  cost_per_unit: decimal
  total_cost: decimal
  status: enum('draft', 'confirmed', 'done', 'cancelled')
  related_type: string ('sale', 'purchase', 'transfer', 'adjustment', 'production')
  related_id: UUID
  done_at: timestamp
  done_by: UUID
  created_at: timestamp
}

StockLevel {
  id: UUID
  product_id: UUID
  variant_id: UUID (nullable)
  warehouse_id: UUID
  location_id: UUID
  lot_id: UUID (nullable)
  quantity_on_hand: decimal
  quantity_reserved: decimal
  quantity_available: decimal (computed: on_hand - reserved)
  quantity_incoming: decimal (from POs)
  quantity_outgoing: decimal (from SOs)
  updated_at: timestamp
}

Lot {
  id: UUID
  company_id: UUID
  product_id: UUID
  number: string
  manufacturing_date: date
  expiry_date: date
  notes: text
}
```

#### API Endpoints
```
GET    /api/v1/inventory/products            — List products (paginated, filterable)
POST   /api/v1/inventory/products            — Create product
GET    /api/v1/inventory/products/:id        — Product detail
PUT    /api/v1/inventory/products/:id        — Update
DELETE /api/v1/inventory/products/:id        — Deactivate

GET    /api/v1/inventory/products/:id/stock  — Stock levels across warehouses
GET    /api/v1/inventory/products/:id/moves  — Stock move history

GET    /api/v1/inventory/stock               — Stock summary (all products)
POST   /api/v1/inventory/stock/adjust        — Stock adjustment
POST   /api/v1/inventory/stock/transfer      — Inter-warehouse transfer
POST   /api/v1/inventory/stock/count         — Physical inventory count

GET    /api/v1/inventory/warehouses          — List warehouses
GET    /api/v1/inventory/categories          — List categories (tree)
GET    /api/v1/inventory/valuation           — Stock valuation report
GET    /api/v1/inventory/aging               — Inventory aging report
GET    /api/v1/inventory/low-stock           — Low stock alerts
```

---

### 7.6 Warehouse Module (`warehouse`)

**Purpose:** Advanced warehouse operations for businesses with complex fulfillment needs.

#### Features
- **Location Hierarchy**: Warehouse → Zone → Aisle → Rack → Shelf → Bin
- **Picking Strategies**: FIFO, LIFO, FEFO (First Expiry First Out)
- **Wave Picking**: Group multiple orders into pick waves
- **Put-Away Rules**: Auto-assign locations for incoming stock
- **Picking Orders**: Generate optimized pick lists
- **Packing**: Pack items into packages/boxes with weight tracking
- **Shipping Integration**: Calculate rates, generate labels (future: UPS, FedEx, DHL API)
- **Receiving**: Scan-based receiving workflow
- **Cycle Counting**: Scheduled partial inventory counts by location
- **Cross-Docking**: Direct transfer from receiving to shipping
- **Returns Processing**: Inspect, restock, or dispose returned items

#### Key Data Model
```
PickingOrder {
  id: UUID
  company_id: UUID
  number: string
  type: enum('incoming', 'outgoing', 'internal')
  status: enum('draft', 'assigned', 'picking', 'picked', 'packed', 'shipped', 'done', 'cancelled')
  source_document_type: string
  source_document_id: UUID
  warehouse_id: UUID
  assigned_to: UUID
  priority: enum('low', 'normal', 'high', 'urgent')
  scheduled_date: timestamp
  done_date: timestamp
  notes: text
}

PickingLine {
  id: UUID
  picking_id: UUID
  product_id: UUID
  variant_id: UUID
  lot_id: UUID
  source_location_id: UUID
  destination_location_id: UUID
  quantity_demanded: decimal
  quantity_done: decimal
  unit_id: UUID
}

Package {
  id: UUID
  company_id: UUID
  tracking_number: string
  carrier: string
  weight: decimal
  dimensions: jsonb
  picking_id: UUID
  status: enum('packing', 'packed', 'shipped', 'delivered')
}

PutAwayRule {
  id: UUID
  company_id: UUID
  product_category_id: UUID (nullable)
  product_id: UUID (nullable)
  warehouse_id: UUID
  location_id: UUID
  sequence: integer
}
```

---

### 7.7 Manufacturing Module (`manufacturing`)

**Purpose:** Manage production: BOMs, routing, work orders, shop floor operations.

#### Features
- **Bill of Materials (BOM)**: Multi-level, nested BOMs
- **BOM Versioning**: Track changes to BOMs over time
- **BOM Cost Roll-up**: Calculate product cost from component costs + operations
- **Routing**: Define sequence of operations (workstations) for production
- **Work Centers**: Define machines/workstations with capacity and costs
- **Production Orders (Manufacturing Orders)**: Plan and track production runs
- **Work Orders**: Individual operation steps within a production order
- **Shop Floor Control**: Operator UI for starting/stopping/completing operations
- **Production Planning (MRP)**: Material Requirements Planning
  - Explode BOM to calculate material needs
  - Consider current stock, incoming POs, existing MOs
  - Generate purchase requests for shortages
  - Generate production orders for sub-assemblies
- **Scrap Management**: Record and track production waste
- **By-Products**: Track secondary outputs of production
- **Production Costing**: Actual vs. planned cost tracking
- **Capacity Planning**: Visual calendar of work center utilization
- **Subcontracting**: Send materials to external manufacturers

#### Key Data Model
```
BillOfMaterials {
  id: UUID
  company_id: UUID
  product_id: UUID (finished product)
  variant_id: UUID (nullable)
  name: string
  version: integer
  quantity: decimal (output quantity)
  unit_id: UUID
  type: enum('normal', 'kit', 'subcontracting')
  routing_id: UUID (nullable)
  is_active: boolean
  notes: text
  created_at: timestamp
}

BOMLine {
  id: UUID
  bom_id: UUID
  sequence: integer
  product_id: UUID (component)
  variant_id: UUID (nullable)
  quantity: decimal
  unit_id: UUID
  scrap_percent: decimal
  is_optional: boolean
  operation_id: UUID (nullable — consumed at which operation)
}

Routing {
  id: UUID
  company_id: UUID
  name: string
  product_id: UUID
  is_active: boolean
}

RoutingOperation {
  id: UUID
  routing_id: UUID
  sequence: integer
  name: string
  work_center_id: UUID
  setup_time_minutes: decimal
  operation_time_minutes: decimal (per unit)
  description: text
}

WorkCenter {
  id: UUID
  company_id: UUID
  name: string
  code: string
  type: enum('machine', 'human', 'combined')
  capacity: decimal (units per hour)
  cost_per_hour: decimal
  is_active: boolean
  calendar: jsonb (working hours)
}

ManufacturingOrder {
  id: UUID
  company_id: UUID
  number: string (MO-2026-00001)
  product_id: UUID
  variant_id: UUID (nullable)
  bom_id: UUID
  quantity_planned: decimal
  quantity_produced: decimal
  unit_id: UUID
  status: enum('draft', 'confirmed', 'planned', 'in_progress', 'done', 'cancelled')
  priority: enum('low', 'normal', 'high', 'urgent')
  planned_start: timestamp
  planned_end: timestamp
  actual_start: timestamp
  actual_end: timestamp
  source_document_type: string (e.g., 'sales_order')
  source_document_id: UUID
  planned_cost: decimal
  actual_cost: decimal
  notes: text
  created_at: timestamp
}

WorkOrder {
  id: UUID
  manufacturing_order_id: UUID
  operation_id: UUID
  work_center_id: UUID
  sequence: integer
  name: string
  status: enum('pending', 'ready', 'in_progress', 'paused', 'done', 'cancelled')
  quantity_planned: decimal
  quantity_produced: decimal
  quantity_scrapped: decimal
  planned_start: timestamp
  planned_end: timestamp
  actual_start: timestamp
  actual_end: timestamp
  duration_planned_minutes: decimal
  duration_actual_minutes: decimal
  assigned_to: UUID
  notes: text
}

MaterialConsumption {
  id: UUID
  work_order_id: UUID
  manufacturing_order_id: UUID
  product_id: UUID
  planned_qty: decimal
  actual_qty: decimal
  unit_id: UUID
  lot_id: UUID (nullable)
  location_id: UUID (source)
}

ScrapOrder {
  id: UUID
  company_id: UUID
  manufacturing_order_id: UUID (nullable)
  work_order_id: UUID (nullable)
  product_id: UUID
  quantity: decimal
  unit_id: UUID
  reason: string
  location_id: UUID (scrap location)
  cost: decimal
}
```

#### Module Interactions
- **Sales → Manufacturing**: Make-to-order products trigger production orders
- **Manufacturing → Inventory**: Consume raw materials, produce finished goods
- **Manufacturing → Purchase**: MRP finds shortages → creates purchase requests
- **Manufacturing → Quality**: Quality checks at production steps
- **Manufacturing → Maintenance**: Equipment breakdowns → maintenance requests
- **Manufacturing → Accounting**: Production costs → WIP → COGS journal entries

---

### 7.8 Quality Control Module (`quality`)

**Purpose:** Ensure products meet quality standards through inspections and checks.

#### Features
- **Quality Check Templates**: Define what to check and acceptable ranges
- **Inspection Points**: Incoming (purchase), In-process (manufacturing), Outgoing (sales)
- **Check Types**: Pass/Fail, Measurement (numeric with tolerance), Visual, Document
- **Non-Conformance Reports (NCR)**: Document and track defects
- **Corrective Actions**: Assign and track corrective measures
- **Quality Alerts**: Notify relevant people of quality issues
- **Statistical Process Control (SPC)**: Track measurements over time, control charts
- **Vendor Quality Rating**: Score vendors based on inspection results

#### Key Data Model
```
QualityCheckTemplate {
  id: UUID
  company_id: UUID
  name: string
  trigger: enum('incoming', 'outgoing', 'in_process', 'manual')
  product_id: UUID (nullable)
  product_category_id: UUID (nullable)
  work_center_id: UUID (nullable)
  instructions: text
}

QualityCheckPoint {
  id: UUID
  template_id: UUID
  sequence: integer
  name: string
  type: enum('pass_fail', 'measurement', 'visual', 'document')
  measurement_unit: string
  min_value: decimal
  max_value: decimal
  target_value: decimal
  is_required: boolean
}

QualityInspection {
  id: UUID
  company_id: UUID
  template_id: UUID
  number: string
  status: enum('draft', 'in_progress', 'passed', 'failed', 'cancelled')
  related_type: string ('purchase_receipt', 'manufacturing_order', 'sales_delivery')
  related_id: UUID
  product_id: UUID
  lot_id: UUID (nullable)
  quantity_inspected: decimal
  quantity_passed: decimal
  quantity_failed: decimal
  inspector_id: UUID
  inspected_at: timestamp
  notes: text
}

QualityInspectionResult {
  id: UUID
  inspection_id: UUID
  check_point_id: UUID
  result: enum('pass', 'fail', 'na')
  measured_value: decimal
  notes: text
  images: jsonb
}

NonConformance {
  id: UUID
  company_id: UUID
  inspection_id: UUID (nullable)
  product_id: UUID
  description: text
  severity: enum('minor', 'major', 'critical')
  status: enum('open', 'investigating', 'corrective_action', 'closed')
  root_cause: text
  corrective_action: text
  assigned_to: UUID
  due_date: date
  closed_at: timestamp
}
```

---

### 7.9 Accounting Module (`accounting`)

**Purpose:** Full double-entry accounting: GL, AP, AR, bank reconciliation, financial reports.

#### Features
- **Chart of Accounts**: Customizable, hierarchical account structure
- **Journal Entries**: Manual and auto-generated entries
- **General Ledger**: Complete transaction record
- **Accounts Receivable (AR)**: Customer invoices, payments, aging
- **Accounts Payable (AP)**: Vendor bills, payments, aging
- **Invoicing**: Professional invoices with customizable templates
- **Credit Notes / Debit Notes**: Handle returns and adjustments
- **Payment Processing**: Record payments, partial payments, overpayments
- **Payment Allocation**: Allocate payments to specific invoices
- **Bank Accounts**: Track multiple bank accounts
- **Bank Reconciliation**: Match bank statements with GL entries
- **Multi-Currency**: Transactions in foreign currencies with exchange rate tracking
- **Tax Management**: Define tax rates, tax groups, tax reports
- **Fiscal Year / Periods**: Configurable fiscal calendar
- **Budgeting**: Set budgets per account/department, track actuals vs. budget
- **Cost Centers / Departments**: Track expenses by department
- **Financial Reports**:
  - Balance Sheet
  - Profit & Loss (Income Statement)
  - Cash Flow Statement
  - Trial Balance
  - Aged Receivables / Payables
  - Tax Report
  - General Ledger Report
- **Fixed Asset Depreciation**: Straight-line, declining balance, sum-of-years
- **Recurring Entries**: Automated monthly/yearly journal entries
- **Lock Dates**: Prevent changes to past periods

#### Key Data Model
```
Account {
  id: UUID
  company_id: UUID
  code: string (e.g., "1100", "4200")
  name: string
  type: enum('asset', 'liability', 'equity', 'revenue', 'expense')
  sub_type: enum('current_asset', 'fixed_asset', 'current_liability', 'long_term_liability',
                  'equity', 'retained_earnings', 'revenue', 'other_income',
                  'cost_of_goods', 'operating_expense', 'other_expense')
  parent_id: UUID (nullable)
  is_bank_account: boolean
  is_reconcilable: boolean
  currency_id: UUID (nullable — for foreign currency accounts)
  opening_balance: decimal
  current_balance: decimal
  is_active: boolean
  description: text
}

FiscalYear {
  id: UUID
  company_id: UUID
  name: string
  start_date: date
  end_date: date
  status: enum('open', 'closed')
  lock_date: date (nullable — entries before this are locked)
}

JournalEntry {
  id: UUID
  company_id: UUID
  number: string (JE-2026-00001)
  date: date
  journal_type: enum('sale', 'purchase', 'cash', 'bank', 'general', 'opening')
  status: enum('draft', 'posted', 'cancelled')
  reference: string
  narration: text
  source_type: string ('invoice', 'bill', 'payment', 'manual', 'depreciation')
  source_id: UUID
  fiscal_year_id: UUID
  currency_id: UUID
  exchange_rate: decimal
  total_debit: decimal
  total_credit: decimal
  is_recurring: boolean
  recurring_config: jsonb
  posted_by: UUID
  posted_at: timestamp
  created_at: timestamp
}

JournalEntryLine {
  id: UUID
  journal_entry_id: UUID
  account_id: UUID
  contact_id: UUID (nullable — for AR/AP entries)
  description: string
  debit: decimal
  credit: decimal
  currency_id: UUID
  amount_currency: decimal (in foreign currency)
  tax_id: UUID (nullable)
  cost_center_id: UUID (nullable)
  reconciled: boolean
  reconciliation_id: UUID (nullable)
}

Invoice {
  id: UUID
  company_id: UUID
  number: string
  type: enum('out_invoice', 'out_credit', 'in_invoice', 'in_credit')
  status: enum('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled')
  contact_id: UUID
  billing_address_id: UUID
  invoice_date: date
  due_date: date
  payment_term_id: UUID
  currency_id: UUID
  exchange_rate: decimal
  journal_entry_id: UUID (the posted GL entry)
  
  subtotal: decimal
  discount_total: decimal
  tax_total: decimal
  grand_total: decimal
  amount_paid: decimal
  amount_due: decimal
  
  source_type: string ('sales_order', 'manual')
  source_id: UUID
  
  notes: text
  terms: text
  created_at: timestamp
}

InvoiceLine {
  id: UUID
  invoice_id: UUID
  sequence: integer
  product_id: UUID (nullable)
  account_id: UUID
  description: string
  quantity: decimal
  unit_price: decimal
  discount_percent: decimal
  tax_ids: UUID[]
  tax_amount: decimal
  subtotal: decimal
  total: decimal
}

Payment {
  id: UUID
  company_id: UUID
  number: string
  type: enum('inbound', 'outbound')
  method: enum('cash', 'bank_transfer', 'check', 'credit_card', 'online')
  status: enum('draft', 'posted', 'reconciled', 'cancelled')
  contact_id: UUID
  amount: decimal
  currency_id: UUID
  exchange_rate: decimal
  payment_date: date
  bank_account_id: UUID
  journal_entry_id: UUID
  reference: string
  notes: text
}

PaymentAllocation {
  id: UUID
  payment_id: UUID
  invoice_id: UUID
  amount: decimal
}

BankAccount {
  id: UUID
  company_id: UUID
  name: string
  account_id: UUID (GL account)
  bank_name: string
  account_number: string
  routing_number: string
  currency_id: UUID
  opening_balance: decimal
  current_balance: decimal
}

BankReconciliation {
  id: UUID
  bank_account_id: UUID
  statement_date: date
  opening_balance: decimal
  closing_balance: decimal
  status: enum('draft', 'reconciled')
}

BankReconciliationLine {
  id: UUID
  reconciliation_id: UUID
  journal_entry_line_id: UUID (nullable — matched GL entry)
  date: date
  description: string
  amount: decimal
  is_matched: boolean
}

TaxRate {
  id: UUID
  company_id: UUID
  name: string
  rate: decimal (e.g., 18.00 for 18%)
  type: enum('percentage', 'fixed')
  scope: enum('sale', 'purchase', 'both')
  account_id: UUID (tax account in GL)
  is_active: boolean
}

CostCenter {
  id: UUID
  company_id: UUID
  name: string
  code: string
  parent_id: UUID
  manager_id: UUID
  is_active: boolean
}

Budget {
  id: UUID
  company_id: UUID
  name: string
  fiscal_year_id: UUID
  status: enum('draft', 'approved', 'closed')
}

BudgetLine {
  id: UUID
  budget_id: UUID
  account_id: UUID
  cost_center_id: UUID (nullable)
  period: string (e.g., '2026-01')
  planned_amount: decimal
  actual_amount: decimal (computed from GL)
}

Currency {
  id: UUID
  code: string (ISO: USD, EUR, PKR)
  name: string
  symbol: string
  decimal_places: integer
  is_active: boolean
}

ExchangeRate {
  id: UUID
  company_id: UUID
  from_currency_id: UUID
  to_currency_id: UUID
  rate: decimal
  date: date
}
```

#### API Endpoints
```
# Chart of Accounts
GET    /api/v1/accounting/accounts
POST   /api/v1/accounting/accounts
PUT    /api/v1/accounting/accounts/:id
GET    /api/v1/accounting/accounts/:id/ledger

# Journal Entries
GET    /api/v1/accounting/journal-entries
POST   /api/v1/accounting/journal-entries
POST   /api/v1/accounting/journal-entries/:id/post
POST   /api/v1/accounting/journal-entries/:id/cancel

# Invoices
GET    /api/v1/accounting/invoices
POST   /api/v1/accounting/invoices
PUT    /api/v1/accounting/invoices/:id
POST   /api/v1/accounting/invoices/:id/post
POST   /api/v1/accounting/invoices/:id/send
GET    /api/v1/accounting/invoices/:id/pdf
POST   /api/v1/accounting/invoices/:id/payment

# Payments
GET    /api/v1/accounting/payments
POST   /api/v1/accounting/payments
POST   /api/v1/accounting/payments/:id/post

# Bank Reconciliation
GET    /api/v1/accounting/bank-accounts
GET    /api/v1/accounting/bank-accounts/:id/reconciliation
POST   /api/v1/accounting/bank-accounts/:id/reconciliation
POST   /api/v1/accounting/bank-accounts/:id/import-statement

# Reports
GET    /api/v1/accounting/reports/balance-sheet
GET    /api/v1/accounting/reports/profit-loss
GET    /api/v1/accounting/reports/cash-flow
GET    /api/v1/accounting/reports/trial-balance
GET    /api/v1/accounting/reports/general-ledger
GET    /api/v1/accounting/reports/aged-receivables
GET    /api/v1/accounting/reports/aged-payables
GET    /api/v1/accounting/reports/tax-report

# Budgets
GET    /api/v1/accounting/budgets
POST   /api/v1/accounting/budgets
GET    /api/v1/accounting/budgets/:id/vs-actual
```

#### Module Interactions
- **Sales → Accounting**: Sales invoice → AR journal entry
- **Purchase → Accounting**: Vendor bill → AP journal entry
- **Inventory → Accounting**: Stock valuation changes → COGS entries
- **Manufacturing → Accounting**: Production costs → WIP → FG entries
- **HR → Accounting**: Payroll → salary expense entries
- **POS → Accounting**: Daily POS summary → cash/card journal entries
- **Assets → Accounting**: Depreciation entries

---

### 7.10 Point of Sale Module (`pos`)

**Purpose:** Fast, reliable POS for retail shops and restaurants, works offline.

#### Features

**Retail POS Features:**
- **Fast Product Search**: By name, barcode scan, category browse
- **Barcode Scanner Support**: USB and camera-based scanning
- **Cart Management**: Add, remove, change quantity, apply discounts
- **Multiple Payment Methods**: Cash, card, split payments, store credit
- **Cash Drawer Management**: Open/close sessions, cash in/out
- **Receipt Printing**: Thermal printer support (ESC/POS protocol)
- **Customer Selection**: Link sale to customer for loyalty/history
- **Loyalty Program**: Points accumulation and redemption
- **Returns at POS**: Process returns and issue refunds/credit notes
- **Hold & Recall Orders**: Park a sale and serve another customer
- **Daily Sessions**: Open/close with cash counting reconciliation
- **Offline Mode**: Full functionality offline with sync when online
- **Multi-Terminal**: Multiple POS terminals per store

**Restaurant POS Features:**
- **Table Management**: Visual floor plan with table status
- **Table Ordering**: Assign orders to tables
- **Course Management**: Fire courses separately (appetizer, main, dessert)
- **Kitchen Display System (KDS)**: Orders appear on kitchen screens
- **Order Modifications**: Add notes, substitutions, special requests
- **Bill Splitting**: Split by item, by seat, or equal split
- **Tips**: Handle tip entry and tracking
- **Reservations**: Simple table reservation system

#### Key Data Model
```
POSConfig {
  id: UUID
  company_id: UUID
  name: string
  type: enum('retail', 'restaurant', 'bar')
  warehouse_id: UUID
  price_list_id: UUID
  default_payment_method_ids: UUID[]
  receipt_header: text
  receipt_footer: text
  allow_discount: boolean
  max_discount_percent: decimal
  require_customer: boolean
  enable_tips: boolean
  enable_loyalty: boolean
  is_active: boolean
}

POSSession {
  id: UUID
  config_id: UUID
  user_id: UUID (cashier)
  status: enum('opening', 'open', 'closing', 'closed')
  opening_balance: decimal
  closing_balance: decimal
  expected_closing_balance: decimal (computed)
  cash_in_total: decimal
  cash_out_total: decimal
  opened_at: timestamp
  closed_at: timestamp
  notes: text
}

POSOrder {
  id: UUID
  company_id: UUID
  session_id: UUID
  number: string
  status: enum('draft', 'paid', 'done', 'refunded', 'cancelled')
  customer_id: UUID (nullable)
  table_id: UUID (nullable, restaurant)
  floor_id: UUID (nullable)
  order_type: enum('dine_in', 'takeaway', 'delivery')
  
  subtotal: decimal
  discount_total: decimal
  tax_total: decimal
  grand_total: decimal
  tip_amount: decimal
  
  loyalty_points_earned: integer
  loyalty_points_redeemed: integer
  
  notes: text
  is_held: boolean
  
  synced: boolean (for offline)
  created_at: timestamp
}

POSOrderLine {
  id: UUID
  order_id: UUID
  product_id: UUID
  variant_id: UUID
  description: string
  quantity: decimal
  unit_price: decimal
  discount_percent: decimal
  tax_amount: decimal
  subtotal: decimal
  total: decimal
  notes: string (special instructions)
  course: enum('appetizer', 'main', 'dessert', 'drink') (restaurant)
  status: enum('ordered', 'preparing', 'ready', 'served') (restaurant KDS)
}

POSPayment {
  id: UUID
  order_id: UUID
  method: enum('cash', 'card', 'mobile', 'store_credit', 'loyalty_points')
  amount: decimal
  reference: string
  status: enum('pending', 'completed', 'refunded')
}

POSCashMove {
  id: UUID
  session_id: UUID
  type: enum('in', 'out')
  amount: decimal
  reason: string
  user_id: UUID
  created_at: timestamp
}

RestaurantFloor {
  id: UUID
  pos_config_id: UUID
  name: string
  background_image: string
}

RestaurantTable {
  id: UUID
  floor_id: UUID
  name: string
  seats: integer
  position_x: decimal
  position_y: decimal
  shape: enum('square', 'round', 'rectangle')
  status: enum('available', 'occupied', 'reserved', 'cleaning')
}

LoyaltyProgram {
  id: UUID
  company_id: UUID
  name: string
  points_per_currency: decimal (e.g., 1 point per $1 spent)
  currency_per_point: decimal (e.g., $0.01 per point redeemed)
  min_redemption_points: integer
  is_active: boolean
}

CustomerLoyalty {
  id: UUID
  program_id: UUID
  customer_id: UUID
  total_points_earned: integer
  total_points_redeemed: integer
  current_points: integer
}
```

---

### 7.11 Human Resources Module (`hr`)

**Purpose:** Complete HR management: employees, attendance, leave, payroll, recruitment.

#### Sub-Modules

#### 7.11.1 Employee Management
- Employee profiles with all personal and job details
- Department & job position hierarchy
- Employment history, promotions, transfers
- Employee documents (contracts, ID copies, certificates)
- Emergency contacts
- Employee self-service portal

#### 7.11.2 Attendance & Time Tracking
- Check-in / Check-out (web, mobile, biometric integration API)
- Timesheet entry for project-based work
- Overtime calculation (configurable rules)
- Late arrival / early departure tracking
- Attendance reports

#### 7.11.3 Leave Management
- Leave types: Annual, Sick, Casual, Maternity, Unpaid, Custom
- Leave allocation per employee per year
- Leave request & approval workflow
- Leave balance tracking
- Holiday calendar
- Public holidays (per country/region)

#### 7.11.4 Payroll
- Salary structures: Basic + Allowances + Deductions
- Pay schedules: Weekly, Bi-weekly, Monthly
- Payslip generation
- Tax calculations (configurable per country)
- Loan management (EMI deduction from salary)
- Advances / reimbursements
- Payroll accounting integration (auto-create journal entries)
- Payslip PDF generation

#### 7.11.5 Recruitment
- Job openings / vacancies
- Application tracking (Kanban pipeline)
- Interview scheduling
- Offer letters
- Onboarding checklists

#### 7.11.6 Expense Management
- Employee expense claims
- Receipt uploads
- Approval workflow
- Reimbursement processing → Accounting integration

#### Key Data Model
```
Employee {
  id: UUID
  company_id: UUID
  contact_id: UUID (links to contacts module)
  user_id: UUID (nullable — for portal access)
  employee_number: string
  department_id: UUID
  job_position_id: UUID
  job_title: string
  manager_id: UUID (another employee)
  employment_type: enum('full_time', 'part_time', 'contract', 'intern')
  status: enum('active', 'on_leave', 'suspended', 'terminated')
  hire_date: date
  termination_date: date
  probation_end_date: date
  
  date_of_birth: date
  gender: enum('male', 'female', 'other', 'undisclosed')
  marital_status: enum('single', 'married', 'divorced', 'widowed')
  national_id: string
  passport_number: string
  
  bank_account_id: UUID
  salary_structure_id: UUID
  
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  
  work_location: string
  work_shift_id: UUID
  
  notes: text
  custom_fields: jsonb
}

Department {
  id: UUID
  company_id: UUID
  name: string
  code: string
  parent_id: UUID
  manager_id: UUID
  cost_center_id: UUID
}

JobPosition {
  id: UUID
  company_id: UUID
  department_id: UUID
  title: string
  description: text
  is_active: boolean
}

Attendance {
  id: UUID
  company_id: UUID
  employee_id: UUID
  date: date
  check_in: timestamp
  check_out: timestamp
  worked_hours: decimal
  overtime_hours: decimal
  status: enum('present', 'absent', 'half_day', 'on_leave', 'holiday')
  source: enum('manual', 'web', 'mobile', 'biometric')
  notes: text
}

LeaveType {
  id: UUID
  company_id: UUID
  name: string
  code: string
  default_allocation: decimal (days per year)
  is_paid: boolean
  requires_approval: boolean
  max_consecutive_days: integer
  allow_negative: boolean
  is_active: boolean
}

LeaveRequest {
  id: UUID
  company_id: UUID
  employee_id: UUID
  leave_type_id: UUID
  start_date: date
  end_date: date
  duration_days: decimal
  status: enum('draft', 'submitted', 'approved', 'refused', 'cancelled')
  reason: text
  approved_by: UUID
  approved_at: timestamp
}

LeaveAllocation {
  id: UUID
  employee_id: UUID
  leave_type_id: UUID
  fiscal_year_id: UUID
  allocated_days: decimal
  used_days: decimal
  remaining_days: decimal (computed)
}

SalaryStructure {
  id: UUID
  company_id: UUID
  name: string
  pay_frequency: enum('weekly', 'biweekly', 'monthly')
  is_active: boolean
}

SalaryComponent {
  id: UUID
  company_id: UUID
  name: string
  code: string
  type: enum('earning', 'deduction')
  is_taxable: boolean
  is_fixed: boolean
  calculation_type: enum('fixed', 'percentage')
  percentage_of: string (nullable, e.g., 'basic')
  default_amount: decimal
  account_id: UUID (GL account)
}

SalaryStructureLine {
  id: UUID
  structure_id: UUID
  component_id: UUID
  sequence: integer
  amount: decimal
  formula: string (nullable)
}

Payslip {
  id: UUID
  company_id: UUID
  employee_id: UUID
  salary_structure_id: UUID
  period_start: date
  period_end: date
  status: enum('draft', 'computed', 'approved', 'paid', 'cancelled')
  basic_salary: decimal
  gross_salary: decimal
  total_deductions: decimal
  net_salary: decimal
  journal_entry_id: UUID
  paid_at: timestamp
}

PayslipLine {
  id: UUID
  payslip_id: UUID
  component_id: UUID
  type: enum('earning', 'deduction')
  amount: decimal
}

ExpenseClaim {
  id: UUID
  company_id: UUID
  employee_id: UUID
  number: string
  status: enum('draft', 'submitted', 'approved', 'paid', 'rejected')
  total_amount: decimal
  approved_by: UUID
  approved_at: timestamp
  payment_id: UUID
  notes: text
}

ExpenseClaimLine {
  id: UUID
  claim_id: UUID
  date: date
  description: string
  category: string
  amount: decimal
  receipt_url: string
  account_id: UUID
}
```

---

### 7.12 Project Management Module (`projects`)

**Purpose:** Plan, track, and manage projects, tasks, and timesheets.

#### Features
- **Projects**: Create projects with start/end dates, budgets, milestones
- **Tasks**: Hierarchical tasks (task → subtask) with assignees
- **Kanban View**: Drag-and-drop task status management
- **Gantt Chart**: Visual timeline with dependencies
- **Timesheets**: Log time against tasks (integrates with HR)
- **Milestones**: Track project milestones and deadlines
- **Project Templates**: Reuse project structures
- **Task Automation**: Auto-assign, auto-move, auto-notify on status change
- **Project Budget**: Track time and costs vs. budget
- **Collaboration**: Comments, attachments, @mentions per task
- **Client Projects**: Link projects to customers for billing

#### Key Data Model
```
Project {
  id: UUID
  company_id: UUID
  name: string
  code: string
  customer_id: UUID (nullable)
  manager_id: UUID
  department_id: UUID
  status: enum('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')
  priority: enum('low', 'normal', 'high', 'critical')
  start_date: date
  end_date: date
  budget_hours: decimal
  budget_amount: decimal
  actual_hours: decimal (computed)
  actual_amount: decimal
  description: text
  tags: string[]
  template_id: UUID (nullable)
}

Task {
  id: UUID
  project_id: UUID
  parent_task_id: UUID (nullable)
  name: string
  description: text
  assigned_to: UUID
  reviewer_id: UUID
  status: enum('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled')
  priority: enum('low', 'normal', 'high', 'urgent')
  start_date: date
  due_date: date
  estimated_hours: decimal
  actual_hours: decimal
  sequence: integer
  tags: string[]
  milestone_id: UUID (nullable)
}

TaskDependency {
  id: UUID
  task_id: UUID
  depends_on_task_id: UUID
  type: enum('finish_to_start', 'start_to_start', 'finish_to_finish')
}

Timesheet {
  id: UUID
  company_id: UUID
  employee_id: UUID
  project_id: UUID
  task_id: UUID
  date: date
  hours: decimal
  description: text
  is_billable: boolean
  billing_rate: decimal
  status: enum('draft', 'submitted', 'approved', 'invoiced')
}

Milestone {
  id: UUID
  project_id: UUID
  name: string
  due_date: date
  status: enum('pending', 'reached', 'overdue')
}
```

---

### 7.13 Helpdesk Module (`helpdesk`)

**Purpose:** Customer support ticket management with SLA tracking.

#### Features
- **Tickets**: Create from email, portal, phone, or internal
- **Ticket Pipeline**: Customizable stages (New, In Progress, Waiting, Resolved, Closed)
- **SLA Policies**: Define response and resolution time targets
- **Auto-Assignment**: Round-robin, load-balanced, or rule-based
- **Canned Responses**: Reusable reply templates
- **Knowledge Base**: Articles searchable by customers and agents
- **Customer Portal**: Customers submit and track their tickets
- **Ticket Merging**: Merge duplicate tickets
- **Customer Satisfaction Survey**: Post-resolution rating
- **Escalation Rules**: Auto-escalate on SLA breach

#### Key Data Model
```
Ticket {
  id: UUID
  company_id: UUID
  number: string
  subject: string
  description: text
  customer_id: UUID
  assigned_to: UUID
  team_id: UUID
  stage_id: UUID
  priority: enum('low', 'normal', 'high', 'urgent')
  source: enum('email', 'portal', 'phone', 'internal')
  sla_policy_id: UUID
  sla_response_deadline: timestamp
  sla_resolution_deadline: timestamp
  first_response_at: timestamp
  resolved_at: timestamp
  closed_at: timestamp
  satisfaction_rating: integer (1-5)
  satisfaction_comment: text
  tags: string[]
  custom_fields: jsonb
  created_at: timestamp
}

TicketMessage {
  id: UUID
  ticket_id: UUID
  author_id: UUID
  type: enum('reply', 'note', 'system')
  body: text
  is_internal: boolean
  attachments: jsonb
  created_at: timestamp
}

SLAPolicy {
  id: UUID
  company_id: UUID
  name: string
  priority: enum('low', 'normal', 'high', 'urgent')
  response_time_hours: decimal
  resolution_time_hours: decimal
  business_hours_only: boolean
}

KnowledgeArticle {
  id: UUID
  company_id: UUID
  category_id: UUID
  title: string
  body: text (rich text / markdown)
  is_published: boolean
  views: integer
  helpful_count: integer
  not_helpful_count: integer
  author_id: UUID
  created_at: timestamp
  updated_at: timestamp
}
```

---

### 7.14 Assets Module (`assets`)

**Purpose:** Track fixed assets, compute depreciation, and manage asset lifecycle.

#### Features
- **Asset Registry**: All fixed assets with purchase info, location, custodian
- **Asset Categories**: Group assets (Vehicles, Computers, Furniture, Machinery)
- **Depreciation Methods**: Straight-line, Declining Balance, Sum of Years' Digits
- **Depreciation Schedules**: Auto-compute and post monthly depreciation entries
- **Asset Transfers**: Transfer between departments/locations
- **Asset Disposal**: Sale, scrap, or write-off with accounting entries
- **Asset Maintenance**: Schedule and track maintenance (links to Maintenance module)
- **Asset Valuation Reports**: Book value at any date

#### Key Data Model
```
Asset {
  id: UUID
  company_id: UUID
  name: string
  code: string
  category_id: UUID
  status: enum('draft', 'active', 'disposed', 'scrapped')
  purchase_date: date
  purchase_price: decimal
  salvage_value: decimal
  useful_life_months: integer
  depreciation_method: enum('straight_line', 'declining_balance', 'sum_of_years')
  depreciation_start_date: date
  accumulated_depreciation: decimal
  book_value: decimal (computed)
  location: string
  custodian_id: UUID (employee)
  department_id: UUID
  vendor_id: UUID
  invoice_id: UUID (nullable)
  
  asset_account_id: UUID
  depreciation_account_id: UUID
  expense_account_id: UUID
  
  notes: text
  serial_number: string
  custom_fields: jsonb
}

DepreciationSchedule {
  id: UUID
  asset_id: UUID
  date: date
  amount: decimal
  accumulated: decimal
  book_value: decimal
  journal_entry_id: UUID (nullable — when posted)
  status: enum('scheduled', 'posted')
}
```

---

### 7.15 Maintenance Module (`maintenance`)

**Purpose:** Manage equipment maintenance — preventive and corrective.

#### Features
- **Equipment Registry**: All machinery/equipment with specs
- **Preventive Maintenance**: Scheduled maintenance (by time or usage counters)
- **Corrective Maintenance**: Log breakdowns and repairs
- **Maintenance Requests**: Anyone can request maintenance
- **Maintenance Teams**: Assign teams with technician roles
- **Spare Parts**: Link maintenance to inventory for parts consumption
- **Maintenance Calendar**: Visual view of schedule
- **Equipment Downtime**: Track and analyze downtime
- **MTBF / MTTR**: Mean time between failures / Mean time to repair analytics

#### Key Data Model
```
Equipment {
  id: UUID
  company_id: UUID
  name: string
  code: string
  category: string
  serial_number: string
  manufacturer: string
  model: string
  purchase_date: date
  warranty_expiry: date
  location: string
  department_id: UUID
  work_center_id: UUID (nullable)
  asset_id: UUID (nullable — links to Assets module)
  status: enum('operational', 'maintenance', 'broken', 'retired')
  notes: text
  custom_fields: jsonb
}

MaintenanceRequest {
  id: UUID
  company_id: UUID
  number: string
  equipment_id: UUID
  type: enum('preventive', 'corrective')
  priority: enum('low', 'normal', 'high', 'emergency')
  status: enum('requested', 'confirmed', 'in_progress', 'done', 'cancelled')
  description: text
  requested_by: UUID
  assigned_team_id: UUID
  assigned_to: UUID
  scheduled_date: date
  actual_start: timestamp
  actual_end: timestamp
  duration_hours: decimal
  cost: decimal
  parts_consumed: jsonb [{product_id, quantity, cost}]
  root_cause: text
  resolution: text
  notes: text
}

PreventiveSchedule {
  id: UUID
  equipment_id: UUID
  name: string
  frequency_type: enum('days', 'weeks', 'months', 'usage_counter')
  frequency_value: integer
  last_done_date: date
  next_due_date: date
  assigned_team_id: UUID
  checklist: jsonb
  is_active: boolean
}
```

---

### 7.16 Fleet Module (`fleet`)

**Purpose:** Manage company vehicles — assignments, fuel, maintenance, costs.

#### Features
- **Vehicle Registry**: All vehicles with details (make, model, plate, VIN)
- **Driver Assignment**: Assign vehicles to employees
- **Fuel Logging**: Record fuel purchases with cost tracking
- **Odometer Tracking**: Track mileage
- **Vehicle Maintenance**: Schedule services (links to Maintenance module)
- **Insurance Tracking**: Policy details, renewals, claims
- **Vehicle Costs**: All costs aggregated (fuel + maintenance + insurance + depreciation)
- **Vehicle Contracts**: Lease, rental agreements
- **Vehicle Documents**: Registration, insurance docs, inspection certificates

#### Key Data Model
```
Vehicle {
  id: UUID
  company_id: UUID
  name: string
  license_plate: string
  vin: string
  make: string
  model: string
  year: integer
  color: string
  fuel_type: enum('petrol', 'diesel', 'electric', 'hybrid', 'cng')
  transmission: enum('manual', 'automatic')
  status: enum('active', 'maintenance', 'inactive', 'sold')
  driver_id: UUID (nullable, employee)
  department_id: UUID
  asset_id: UUID (nullable)
  odometer: decimal
  purchase_date: date
  purchase_price: decimal
  notes: text
}

FuelLog {
  id: UUID
  vehicle_id: UUID
  date: date
  fuel_type: string
  quantity: decimal
  unit_price: decimal
  total_cost: decimal
  odometer: decimal
  station: string
  driver_id: UUID
}

VehicleContract {
  id: UUID
  vehicle_id: UUID
  type: enum('lease', 'insurance', 'service_contract')
  vendor_id: UUID
  start_date: date
  end_date: date
  cost: decimal
  frequency: enum('monthly', 'quarterly', 'yearly', 'one_time')
  notes: text
}
```

---

### 7.17 Documents Module (`documents`)

**Purpose:** Centralized document management for all modules.

#### Features
- **Folder Structure**: Hierarchical folders per module or custom
- **File Upload**: Drag-and-drop, multiple files
- **Versioning**: Track file versions
- **Access Control**: Folder/file-level permissions
- **Tags & Search**: Tag files, full-text search in file names
- **Linked Documents**: Auto-organize documents by module (e.g., all PO documents)
- **Shared Links**: Generate shareable links with optional expiry
- **Document Templates**: Invoice templates, contract templates

#### Key Data Model
```
Folder {
  id: UUID
  company_id: UUID
  name: string
  parent_id: UUID (nullable)
  module: string (nullable — auto-organized)
  created_by: UUID
}

Document {
  id: UUID
  company_id: UUID
  folder_id: UUID
  name: string
  file_url: string
  file_size: integer
  mime_type: string
  version: integer
  tags: string[]
  linked_type: string (nullable)
  linked_id: UUID (nullable)
  uploaded_by: UUID
  created_at: timestamp
}

DocumentVersion {
  id: UUID
  document_id: UUID
  version: integer
  file_url: string
  file_size: integer
  uploaded_by: UUID
  created_at: timestamp
  change_notes: text
}

SharedLink {
  id: UUID
  document_id: UUID
  token: string
  expires_at: timestamp
  password_hash: string (nullable)
  download_count: integer
  created_by: UUID
}
```

---

### 7.18 Reports Module (`reports`)

**Purpose:** Centralized reporting engine with custom report builder.

#### Features
- **Pre-built Reports**: Standard reports per module (see module sections)
- **Custom Report Builder**: Drag-and-drop report designer
  - Select data source (module/table)
  - Choose columns, filters, grouping, sorting
  - Choose chart type (table, bar, line, pie, pivot)
- **Saved Reports**: Save and share custom reports
- **Scheduled Reports**: Email reports on schedule (daily, weekly, monthly)
- **Dashboard Widgets**: Any report can become a dashboard widget
- **Export**: PDF, CSV, XLSX export for all reports
- **Report Parameters**: Date range, filters passed at runtime
- **Pivot Tables**: Interactive pivot analysis

#### Key Data Model
```
ReportDefinition {
  id: UUID
  company_id: UUID
  name: string
  description: text
  module: string
  type: enum('table', 'chart', 'pivot', 'summary')
  config: jsonb {
    data_source: string,
    columns: [{field, label, type, aggregate}],
    filters: [{field, operator, value}],
    group_by: [string],
    sort_by: [{field, direction}],
    chart_config: {type, x_axis, y_axis, series}
  }
  is_system: boolean (built-in vs custom)
  created_by: UUID
  is_shared: boolean
}

ScheduledReport {
  id: UUID
  report_id: UUID
  frequency: enum('daily', 'weekly', 'monthly')
  day_of_week: integer
  day_of_month: integer
  time: string (HH:mm)
  format: enum('pdf', 'xlsx', 'csv')
  recipients: string[] (email addresses)
  is_active: boolean
  last_sent_at: timestamp
}
```

---

### 7.19 Subscriptions Module (`subscriptions`)

**Purpose:** Manage recurring billing for subscription-based businesses.

#### Features
- **Subscription Plans**: Define plans with pricing tiers
- **Customer Subscriptions**: Link customers to plans
- **Recurring Invoices**: Auto-generate invoices per billing cycle
- **Proration**: Handle plan changes mid-cycle
- **Trial Periods**: Free trial support
- **MRR/ARR Tracking**: Monthly/Annual Recurring Revenue analytics
- **Churn Analysis**: Track and analyze customer churn
- **Usage-Based Billing**: Meter usage and bill accordingly
- **Dunning**: Handle failed payments with retry logic and notifications

#### Key Data Model
```
SubscriptionPlan {
  id: UUID
  company_id: UUID
  name: string
  billing_interval: enum('weekly', 'monthly', 'quarterly', 'yearly')
  price: decimal
  currency_id: UUID
  trial_days: integer
  features: jsonb
  is_active: boolean
}

Subscription {
  id: UUID
  company_id: UUID
  customer_id: UUID
  plan_id: UUID
  status: enum('trial', 'active', 'paused', 'cancelled', 'expired')
  start_date: date
  trial_end_date: date
  current_period_start: date
  current_period_end: date
  cancelled_at: timestamp
  cancel_reason: text
  next_invoice_date: date
}
```

---

### 7.20 Settings Module (`settings`)

**Purpose:** System-wide configuration and administration.

#### Features
- **Company Profile**: Name, logo, address, tax ID, fiscal year
- **User Management**: Create users, assign roles, deactivate
- **Role & Permission Management**: Create custom roles, assign permissions
- **Module Activation**: Enable/disable modules per company
- **Email Configuration**: SMTP settings, email templates
- **Numbering Sequences**: Customize document number formats (SO-{YYYY}-{####})
- **Currency Management**: Active currencies, exchange rates
- **Tax Configuration**: Tax rates, tax groups
- **Localization**: Language, timezone, date format, number format
- **Backup & Export**: Full data export
- **API Keys**: Generate API keys for integrations
- **Webhook Management**: Configure outbound webhooks
- **System Health**: Storage usage, active users, error logs

---

## 8. Cross-Module Features

### 8.1 Universal Document Number Generator
Every document (SO, PO, INV, MO, etc.) gets an auto-incremented number.
- Format configurable per document type per company
- Pattern: `{PREFIX}-{YYYY}-{SEQ:5}` → `SO-2026-00001`
- No gaps (use PostgreSQL sequences)

### 8.2 Universal Status Tracking
Every document goes through a status lifecycle:
```
draft → submitted/sent → confirmed/approved → processing → done → cancelled
```
Status transitions emit events consumed by other modules.

### 8.3 Universal Notes & Activity
Every record supports:
- Internal notes
- Customer-facing notes
- Activity timeline (comments, status changes, emails, files)
- @mentions → notifications

### 8.4 Universal Tags
Any record can have tags (string[]). Tags are company-scoped.

### 8.5 Universal Attachments
Any record can have file attachments via the polymorphic attachment system.

### 8.6 Universal Custom Fields
Any module's records can have tenant-specific custom fields stored in JSONB.

### 8.7 Soft Deletes
No record is ever physically deleted. All tables have `is_deleted` + `deleted_at` + `deleted_by`.
Queries filter out deleted records by default.

### 8.8 Timestamps
Every table: `created_at`, `updated_at`, `created_by`, `updated_by`.

---

## 9. Data Models & Relationships

### Entity Relationship Overview
```
                                    ┌──────────┐
                                    │  Company  │ (Tenant)
                                    └─────┬────┘
                                          │ 1:N on EVERY table
            ┌─────────────────────────────┼─────────────────────────────┐
            │                             │                             │
      ┌─────▼────┐               ┌───────▼───────┐             ┌──────▼─────┐
      │ Contacts │               │    Products    │             │   Users    │
      └──┬───┬───┘               └───┬───────┬───┘             └──────┬─────┘
         │   │                       │       │                        │
    ┌────┘   └────┐             ┌────┘       └────┐              ┌────┘
    │             │             │                  │              │
┌───▼───┐   ┌────▼────┐   ┌───▼────┐      ┌─────▼─────┐  ┌────▼─────┐
│ Sales │   │Purchase │   │  Stock  │      │    BOM    │  │ Employee │
│Orders │   │ Orders  │   │ Levels  │      │           │  │          │
└───┬───┘   └────┬────┘   └───┬────┘      └─────┬─────┘  └────┬─────┘
    │            │             │                  │              │
    └──────┬─────┘        ┌────┘            ┌────┘         ┌────┘
           │              │                 │              │
    ┌──────▼──────┐  ┌───▼────────┐  ┌────▼──────┐  ┌───▼──────┐
    │  Invoices   │  │Stock Moves │  │ Mfg Orders│  │ Payroll  │
    └──────┬──────┘  └────────────┘  └───────────┘  └──────┬───┘
           │                                                │
    ┌──────▼──────────────────────────────────────────────▼──────┐
    │                    Journal Entries (GL)                      │
    │                    (Accounting Core)                         │
    └─────────────────────────────────────────────────────────────┘
```

### Cross-Module Foreign Keys
- `SalesOrder.contact_id` → `Contact.id` (customer)
- `PurchaseOrder.vendor_id` → `Contact.id` (vendor)
- `SalesOrder.opportunity_id` → `Opportunity.id` (CRM)
- `Invoice.source_id` → `SalesOrder.id` or `PurchaseOrder.id`
- `StockMove.related_id` → `SalesOrder.id` or `PurchaseOrder.id` or `ManufacturingOrder.id`
- `JournalEntry.source_id` → `Invoice.id` or `Payment.id` or `Payslip.id`
- `ManufacturingOrder.bom_id` → `BillOfMaterials.id`
- `Employee.contact_id` → `Contact.id`
- `Employee.user_id` → `User.id`
- `MaintenanceRequest.equipment_id` → `Equipment.id`
- `Equipment.asset_id` → `Asset.id`
- `Vehicle.asset_id` → `Asset.id`
- `POSOrder.session_id` → `POSSession.id`
- `Timesheet.project_id` → `Project.id`
- `Timesheet.employee_id` → `Employee.id`

---

## 10. API Design

### Convention
- **Base URL**: `/api/v1/`
- **Format**: JSON (request & response)
- **Auth**: Bearer token in `Authorization` header (JWT)
- **Company**: `X-Company-ID` header (for multi-tenant)
- **Pagination**: `?page=1&limit=25` → response includes `{ data, meta: { page, limit, total, totalPages } }`
- **Filtering**: `?filter[status]=active&filter[category_id]=xxx`
- **Sorting**: `?sort=-created_at` (prefix `-` for DESC)
- **Search**: `?search=keyword`
- **Field Selection**: `?fields=id,name,email`
- **Including Relations**: `?include=addresses,bank_accounts`
- **Date Filtering**: `?date_from=2026-01-01&date_to=2026-03-31`

### Standard Response Format
```jsonc
// Success
{
  "success": true,
  "data": { /* or array */ },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Standard HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no content) |
| 400 | Bad Request (validation) |
| 401 | Unauthorized |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Server Actions (Next.js)
For form submissions and mutations from the UI, use Next.js Server Actions:
```typescript
// app/[module]/actions.ts
'use server'
export async function createSalesOrder(formData: FormData) { ... }
export async function confirmSalesOrder(orderId: string) { ... }
```

Server Actions internally call the same Service Layer that API routes use, ensuring business logic is never duplicated.

---

## 11. Multi-Tenancy & SaaS Architecture

### Database Strategy
**Shared database, shared schema with `company_id` isolation.**

Every business table has `company_id: UUID NOT NULL` with an index.

### Tenant Isolation Enforcement
```typescript
// middleware/tenant.ts — applied globally
// 1. Extract company_id from session/header
// 2. Inject into Drizzle query builder context
// 3. All queries automatically filtered by company_id
// 4. All inserts automatically set company_id

// Drizzle example:
const products = await db.query.products.findMany({
  where: and(
    eq(products.companyId, ctx.companyId),  // ALWAYS present
    eq(products.isActive, true),
    // ... other filters
  )
});
```

### Tenant Onboarding
1. Create Company record
2. Create Admin User linked to company
3. Seed Chart of Accounts (from template: country-specific)
4. Seed default tax rates, payment terms, UoMs
5. Seed default roles and permissions
6. Enable selected modules

---

## 12. Role-Based Access Control (RBAC)

### Permission Schema
```
module:resource:action
```

Examples:
```
sales:order:create
sales:order:read
sales:order:read_own     ← only records where created_by = current user
sales:order:update
sales:order:delete
sales:order:approve
sales:order:export
inventory:product:create
accounting:journal:post
hr:payslip:read          ← HR managers
hr:payslip:read_own      ← employees see own payslip
settings:user:manage
```

### Default Roles
| Role | Description | Scope |
|------|-------------|-------|
| Super Admin | Full system access | All companies |
| Company Admin | Full access to one company | Own company |
| Manager | Full access to own module(s) | Module-scoped |
| Team Lead | Read all + write own team's data | Team-scoped |
| User | Standard user — read and write own records | Own records |
| Viewer | Read-only access to assigned modules | Read-only |
| POS Cashier | POS operations only | POS module |
| Accountant | Accounting full access | Accounting module |
| HR Manager | HR full access | HR module |
| Shop Floor Operator | Manufacturing operations | Manufacturing module |

### Data Model
```
Role {
  id: UUID
  company_id: UUID (nullable — null for system roles)
  name: string
  description: string
  is_system: boolean
  parent_role_id: UUID (nullable — inheritance)
}

Permission {
  id: UUID
  code: string (e.g., 'sales:order:create')
  module: string
  resource: string
  action: string
  description: string
}

RolePermission {
  role_id: UUID
  permission_id: UUID
}

UserRole {
  user_id: UUID
  role_id: UUID
  company_id: UUID
}
```

### Enforcement
```typescript
// Middleware-level check (API routes)
async function requirePermission(permission: string) {
  const user = await getSessionUser();
  const hasAccess = await rbac.check(user.id, user.companyId, permission);
  if (!hasAccess) throw new ForbiddenError();
}

// UI-level check (components)
<PermissionGate permission="sales:order:create">
  <Button>Create Sales Order</Button>
</PermissionGate>

// Server Component check
const canCreate = await checkPermission('sales:order:create');
```

---

## 13. UI/UX Design System

### Layout Structure
```
┌──────────────────────────────────────────────────────────────┐
│  Top Bar: Company Logo | Global Search (Cmd+K) | Notifs | User │
├──────┬───────────────────────────────────────────────────────┤
│      │                                                       │
│ Side │   Main Content Area                                   │
│ bar  │   ┌─────────────────────────────────────────────┐    │
│      │   │  Page Header: Title | Breadcrumbs | Actions  │    │
│ Nav  │   ├─────────────────────────────────────────────┤    │
│      │   │                                             │    │
│ Menu │   │  Content: Forms / Tables / Kanban / etc.    │    │
│      │   │                                             │    │
│      │   └─────────────────────────────────────────────┘    │
│      │                                                       │
├──────┴───────────────────────────────────────────────────────┤
│  Status Bar (optional): Background jobs, sync status          │
└──────────────────────────────────────────────────────────────┘
```

### Navigation Structure (Sidebar)
```
📊 Dashboard
📋 CRM
   ├── Leads
   ├── Opportunities
   └── Activities
💰 Sales
   ├── Quotations
   ├── Orders
   └── Price Lists
🛒 Purchase
   ├── Requests
   ├── RFQs
   ├── Purchase Orders
   └── Vendors
📦 Inventory
   ├── Products
   ├── Stock Levels
   ├── Stock Moves
   ├── Warehouses
   └── Categories
🏭 Manufacturing
   ├── BOMs
   ├── Production Orders
   ├── Work Centers
   └── Planning
🏪 Point of Sale
   ├── Sessions
   ├── Orders
   └── Configuration
💳 Accounting
   ├── Dashboard
   ├── Invoices
   ├── Bills
   ├── Payments
   ├── Journal Entries
   ├── Bank Reconciliation
   ├── Chart of Accounts
   └── Reports
👥 HR
   ├── Employees
   ├── Attendance
   ├── Leaves
   ├── Payroll
   ├── Expenses
   └── Recruitment
📁 Projects
   ├── Projects
   ├── Tasks
   └── Timesheets
🎫 Helpdesk
   ├── Tickets
   └── Knowledge Base
🔧 Maintenance
   ├── Equipment
   └── Requests
🚗 Fleet
   ├── Vehicles
   └── Fuel Logs
📊 Reports
⚙️ Settings
```

### Component Patterns

**List Views (all modules follow the same pattern):**
```
┌─────────────────────────────────────────────────────────┐
│  Sales Orders                                [+ New] [⬇ Export] │
├─────────────────────────────────────────────────────────┤
│  🔍 Search...    [Status ▼] [Date Range ▼] [More Filters]    │
├─────────────────────────────────────────────────────────┤
│  ☐ │ Number    │ Customer       │ Date    │ Total   │ Status │
│  ☐ │ SO-00012  │ Acme Corp      │ Mar 1   │ $5,400  │ ✅ Done │
│  ☐ │ SO-00011  │ Widget Inc     │ Feb 28  │ $2,100  │ 🔄 Proc │
│  ☐ │ SO-00010  │ Tech Solutions │ Feb 27  │ $8,750  │ 📝 Draft│
├─────────────────────────────────────────────────────────┤
│  ◀ 1 2 3 ... 12 ▶                  Showing 1-25 of 300 │
└─────────────────────────────────────────────────────────┘
```

**Form Views (all modules follow the same pattern):**
```
┌─────────────────────────────────────────────────────────┐
│  Sales Order SO-2026-00012           [Edit] [Print] [⋯] │
│  Status: Draft → [Confirm] [Send] [Cancel]              │
├─────────────────────────────────────────────────────────┤
│  Customer: [Acme Corp ▼]    Salesperson: [John ▼]       │
│  Order Date: [2026-03-01]   Delivery: [2026-03-15]      │
│  Payment Terms: [Net 30 ▼]  Price List: [Standard ▼]    │
├─────────────────────────────────────────────────────────┤
│  Order Lines                                             │
│  Product      │ Qty │ Price  │ Disc% │ Tax   │ Total   │
│  Widget A     │ 10  │ $50.00 │ 5%    │ 18%   │ $561.00 │
│  Service B    │ 5   │ $120   │ 0%    │ 18%   │ $708.00 │
│                              [+ Add Line]                │
├─────────────────────────────────────────────────────────┤
│  Subtotal: $1,100  │  Tax: $169  │  Total: $1,269      │
├─────────────────────────────────────────────────────────┤
│  [Tab: Notes] [Tab: Deliveries] [Tab: Invoices]         │
│  [Tab: Activity Log]                                     │
└─────────────────────────────────────────────────────────┘
```

### shadcn/ui Components to Install
```
button, input, label, textarea, select, checkbox, radio-group,
switch, slider, calendar, date-picker, popover, dialog, sheet,
drawer, dropdown-menu, context-menu, menubar, navigation-menu,
command (for Cmd+K), table, data-table, pagination, tabs,
accordion, collapsible, card, badge, avatar, tooltip,
toast, sonner, alert, alert-dialog, progress, skeleton,
separator, scroll-area, form, breadcrumb, sidebar,
chart, toggle, toggle-group, resizable
```

---

## 14. File & Folder Structure

```
nextjs-erp/
├── app/                                 # Next.js App Router
│   ├── (auth)/                          # Auth group (no sidebar)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── layout.tsx
│   ├── (portal)/                        # Customer/Vendor portal
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── invoices/page.tsx
│   │   └── tickets/page.tsx
│   ├── (erp)/                           # Main ERP (with sidebar)
│   │   ├── layout.tsx                   # Sidebar + topbar layout
│   │   ├── dashboard/page.tsx
│   │   ├── contacts/
│   │   │   ├── page.tsx                 # List view
│   │   │   ├── new/page.tsx             # Create form
│   │   │   ├── [id]/page.tsx            # Detail / Edit view
│   │   │   ├── [id]/edit/page.tsx
│   │   │   └── components/              # Module-specific components
│   │   │       ├── contact-form.tsx
│   │   │       ├── contact-list.tsx
│   │   │       └── contact-card.tsx
│   │   ├── crm/
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── opportunities/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── pipeline/page.tsx        # Kanban view
│   │   │   └── components/
│   │   ├── sales/
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── price-lists/
│   │   │   └── components/
│   │   ├── purchase/
│   │   │   ├── orders/
│   │   │   ├── rfqs/
│   │   │   ├── vendors/
│   │   │   └── components/
│   │   ├── inventory/
│   │   │   ├── products/
│   │   │   ├── stock/
│   │   │   ├── warehouses/
│   │   │   ├── categories/
│   │   │   └── components/
│   │   ├── warehouse/
│   │   │   ├── picking/
│   │   │   ├── packing/
│   │   │   └── components/
│   │   ├── manufacturing/
│   │   │   ├── boms/
│   │   │   ├── orders/
│   │   │   ├── work-centers/
│   │   │   ├── planning/
│   │   │   └── components/
│   │   ├── quality/
│   │   │   ├── inspections/
│   │   │   ├── ncr/
│   │   │   └── components/
│   │   ├── pos/
│   │   │   ├── terminal/page.tsx        # Full-screen POS interface
│   │   │   ├── sessions/
│   │   │   ├── orders/
│   │   │   ├── config/
│   │   │   └── components/
│   │   │       ├── pos-cart.tsx
│   │   │       ├── pos-product-grid.tsx
│   │   │       ├── pos-payment-dialog.tsx
│   │   │       ├── pos-receipt.tsx
│   │   │       ├── table-map.tsx
│   │   │       └── kitchen-display.tsx
│   │   ├── accounting/
│   │   │   ├── dashboard/
│   │   │   ├── invoices/
│   │   │   ├── bills/
│   │   │   ├── payments/
│   │   │   ├── journal-entries/
│   │   │   ├── bank-reconciliation/
│   │   │   ├── chart-of-accounts/
│   │   │   ├── reports/
│   │   │   └── components/
│   │   ├── hr/
│   │   │   ├── employees/
│   │   │   ├── attendance/
│   │   │   ├── leaves/
│   │   │   ├── payroll/
│   │   │   ├── expenses/
│   │   │   ├── recruitment/
│   │   │   └── components/
│   │   ├── projects/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── timesheets/
│   │   │   └── components/
│   │   ├── helpdesk/
│   │   │   ├── tickets/
│   │   │   ├── knowledge-base/
│   │   │   └── components/
│   │   ├── assets/
│   │   │   ├── assets/
│   │   │   ├── depreciation/
│   │   │   └── components/
│   │   ├── maintenance/
│   │   │   ├── equipment/
│   │   │   ├── requests/
│   │   │   └── components/
│   │   ├── fleet/
│   │   │   ├── vehicles/
│   │   │   ├── fuel-logs/
│   │   │   └── components/
│   │   ├── documents/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── settings/
│   │       ├── company/page.tsx
│   │       ├── users/page.tsx
│   │       ├── roles/page.tsx
│   │       ├── modules/page.tsx
│   │       ├── sequences/page.tsx
│   │       ├── email/page.tsx
│   │       ├── api-keys/page.tsx
│   │       ├── webhooks/page.tsx
│   │       └── components/
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   ├── refresh/route.ts
│   │       │   └── logout/route.ts
│   │       ├── contacts/route.ts
│   │       ├── contacts/[id]/route.ts
│   │       ├── crm/
│   │       │   ├── leads/route.ts
│   │       │   ├── leads/[id]/route.ts
│   │       │   ├── opportunities/route.ts
│   │       │   └── opportunities/[id]/route.ts
│   │       ├── sales/
│   │       │   ├── orders/route.ts
│   │       │   └── orders/[id]/route.ts
│   │       ├── purchase/...
│   │       ├── inventory/...
│   │       ├── manufacturing/...
│   │       ├── accounting/...
│   │       ├── pos/...
│   │       ├── hr/...
│   │       └── ... (same pattern for all modules)
│   ├── globals.css
│   └── layout.tsx                       # Root layout
│
├── lib/                                 # Shared library code
│   ├── utils.ts                         # General utilities (already exists)
│   ├── constants.ts                     # App-wide constants
│   ├── types.ts                         # Shared TypeScript types
│   │
│   ├── db/                              # Database layer
│   │   ├── index.ts                     # Drizzle client instance
│   │   ├── schema/                      # Drizzle schema definitions
│   │   │   ├── index.ts                 # Re-export all schemas
│   │   │   ├── core.ts                  # Company, User, Role, Permission, AuditLog
│   │   │   ├── contacts.ts
│   │   │   ├── crm.ts
│   │   │   ├── sales.ts
│   │   │   ├── purchase.ts
│   │   │   ├── inventory.ts
│   │   │   ├── warehouse.ts
│   │   │   ├── manufacturing.ts
│   │   │   ├── quality.ts
│   │   │   ├── accounting.ts
│   │   │   ├── pos.ts
│   │   │   ├── hr.ts
│   │   │   ├── projects.ts
│   │   │   ├── helpdesk.ts
│   │   │   ├── assets.ts
│   │   │   ├── maintenance.ts
│   │   │   ├── fleet.ts
│   │   │   ├── documents.ts
│   │   │   ├── reports.ts
│   │   │   └── subscriptions.ts
│   │   ├── migrations/                  # Drizzle migrations
│   │   └── seed/                        # Seed data
│   │       ├── index.ts
│   │       ├── chart-of-accounts.ts     # Country-specific COA templates
│   │       ├── roles-permissions.ts
│   │       ├── uom.ts
│   │       ├── currencies.ts
│   │       └── demo-data.ts             # Optional demo data
│   │
│   ├── services/                        # Business logic layer
│   │   ├── base.service.ts              # Base service with CRUD + tenant isolation
│   │   ├── auth.service.ts
│   │   ├── rbac.service.ts
│   │   ├── audit.service.ts
│   │   ├── notification.service.ts
│   │   ├── file.service.ts
│   │   ├── sequence.service.ts
│   │   ├── pdf.service.ts
│   │   ├── email.service.ts
│   │   ├── search.service.ts
│   │   ├── contacts.service.ts
│   │   ├── crm.service.ts
│   │   ├── sales.service.ts
│   │   ├── purchase.service.ts
│   │   ├── inventory.service.ts
│   │   ├── warehouse.service.ts
│   │   ├── manufacturing.service.ts
│   │   ├── quality.service.ts
│   │   ├── accounting.service.ts
│   │   ├── pos.service.ts
│   │   ├── hr.service.ts
│   │   ├── projects.service.ts
│   │   ├── helpdesk.service.ts
│   │   ├── assets.service.ts
│   │   ├── maintenance.service.ts
│   │   ├── fleet.service.ts
│   │   ├── documents.service.ts
│   │   ├── reports.service.ts
│   │   └── subscriptions.service.ts
│   │
│   ├── validators/                      # Zod schemas for validation
│   │   ├── contacts.validator.ts
│   │   ├── sales.validator.ts
│   │   ├── purchase.validator.ts
│   │   ├── inventory.validator.ts
│   │   └── ... (one per module)
│   │
│   ├── hooks/                           # React hooks
│   │   ├── use-auth.ts
│   │   ├── use-permissions.ts
│   │   ├── use-company.ts
│   │   ├── use-debounce.ts
│   │   ├── use-pagination.ts
│   │   └── use-realtime.ts
│   │
│   ├── stores/                          # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── ui.store.ts                  # Sidebar state, theme, etc.
│   │   ├── pos.store.ts                 # POS cart and session
│   │   └── notification.store.ts
│   │
│   └── config/                          # Configuration
│       ├── navigation.ts                # Sidebar nav config
│       ├── modules.ts                   # Module registry
│       └── permissions.ts               # Permission constants
│
├── components/                          # Shared components
│   ├── ui/                              # shadcn/ui (auto-generated)
│   │   ├── button.tsx                   # Already exists
│   │   ├── ... (installed via shadcn CLI)
│   │
│   ├── layout/                          # Layout components
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   ├── breadcrumbs.tsx
│   │   ├── page-header.tsx
│   │   └── mobile-nav.tsx
│   │
│   ├── shared/                          # Reusable business components
│   │   ├── data-table/                  # Generic data table
│   │   │   ├── data-table.tsx
│   │   │   ├── data-table-toolbar.tsx
│   │   │   ├── data-table-pagination.tsx
│   │   │   ├── data-table-column-header.tsx
│   │   │   ├── data-table-faceted-filter.tsx
│   │   │   └── data-table-row-actions.tsx
│   │   ├── form-fields/                 # Reusable form field components
│   │   │   ├── text-field.tsx
│   │   │   ├── number-field.tsx
│   │   │   ├── select-field.tsx
│   │   │   ├── date-field.tsx
│   │   │   ├── file-field.tsx
│   │   │   ├── rich-text-field.tsx
│   │   │   └── contact-picker.tsx
│   │   ├── document-lines/              # Reusable line items (SO, PO, INV)
│   │   │   ├── line-items-table.tsx
│   │   │   └── line-item-row.tsx
│   │   ├── status-badge.tsx
│   │   ├── activity-timeline.tsx
│   │   ├── file-upload.tsx
│   │   ├── global-search.tsx            # Cmd+K search
│   │   ├── notification-bell.tsx
│   │   ├── permission-gate.tsx
│   │   ├── currency-display.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-skeleton.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── kanban-board.tsx
│   │   ├── calendar-view.tsx
│   │   ├── stat-card.tsx
│   │   └── chart-widgets.tsx
│   │
│   └── providers/                       # React context providers
│       ├── auth-provider.tsx
│       ├── company-provider.tsx
│       ├── theme-provider.tsx
│       └── toast-provider.tsx
│
├── middleware.ts                         # Next.js middleware (auth, tenant)
├── drizzle.config.ts                    # Drizzle ORM config
├── .env.local                           # Environment variables
├── .env.example                         # Example env file
├── BRIEF.md                             # This file
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 15. Implementation Order

### Phase 0: Foundation (Week 1-2)
1. Install dependencies (Drizzle, Auth.js, Zustand, React Hook Form, Zod, TanStack Table, Recharts)
2. Set up PostgreSQL database connection
3. Implement core schema (Company, User, Role, Permission, AuditLog)
4. Implement authentication (login, register, session)
5. Implement RBAC middleware
6. Build main layout (sidebar, topbar, breadcrumbs)
7. Build reusable data table component
8. Build reusable form components
9. Build global search (Cmd+K)
10. Build notification system (in-app)
11. Set up audit logging middleware

### Phase 1: Core Business Modules (Week 3-6)
12. **Contacts** module (foundation for everything)
13. **Inventory** module (products, categories, UoM, stock)
14. **Sales** module (quotations, orders, price lists)
15. **Purchase** module (RFQs, purchase orders, reorder rules)
16. **Accounting** module (COA, journal entries, invoices, payments)

### Phase 2: Advanced Operations (Week 7-10)
17. **Warehouse** module (locations, picking, packing)
18. **Manufacturing** module (BOM, production orders, MRP)
19. **Quality** module (inspections, NCR)
20. **POS** module (retail POS first, then restaurant)

### Phase 3: People & Services (Week 11-14)
21. **HR** module (employees, attendance, leave, payroll)
22. **Project Management** module (projects, tasks, timesheets)
23. **Helpdesk** module (tickets, knowledge base)
24. **Expense Management** (part of HR)

### Phase 4: Supporting Modules (Week 15-16)
25. **Assets** module (fixed assets, depreciation)
26. **Maintenance** module (equipment, work orders)
27. **Fleet** module (vehicles, fuel, maintenance)
28. **Documents** module (DMS)

### Phase 5: Intelligence & Polish (Week 17-20)
29. **Reports** module (report builder, scheduled reports)
30. **Subscriptions** module
31. **Dashboard** customization engine
32. **Import/Export** engine finalization
33. **Workflow/Approval** engine
34. **Print/PDF** templates
35. Customer/Vendor **Portal**
36. **Mobile optimization** (PWA)
37. **Offline mode** (POS)
38. End-to-end testing
39. Performance optimization
40. Documentation

---

## 16. Common vs Industry-Specific Features

### Features Common to ALL Businesses
| Feature | Module |
|---------|--------|
| Customer management | Contacts |
| Vendor management | Contacts |
| Product/service catalog | Inventory |
| Sales quotations & orders | Sales |
| Purchasing | Purchase |
| Invoicing & payments | Accounting |
| General ledger & reports | Accounting |
| Employee management | HR |
| Attendance & leave | HR |
| Expense claims | HR |
| File management | Documents |
| User management & access | Settings |
| Dashboard & analytics | Reports |
| Notifications | Core |
| Audit trail | Core |

### Industry-Specific Features

| Industry | Extra Modules/Features |
|----------|----------------------|
| **Manufacturing / Factory** | Manufacturing (BOM, MRP, Work Orders), Quality Control, Maintenance, Shop Floor Control, Scrap Management, Production Costing |
| **Cloth Trading** | Inventory (variants: size/color matrix), Warehouse (location tracking), Price Lists (wholesale vs retail), Lot/Batch tracking, Sales Analytics by fabric/color |
| **Retail Shop** | POS (retail mode), Loyalty Program, Barcode scanning, Cash drawer management, Daily session reconciliation |
| **Restaurant** | POS (restaurant mode), Table Management, Kitchen Display, Course management, Bill splitting, Tips, Recipe-based inventory (ingredients) |
| **Wholesale/Distribution** | Warehouse (advanced picking/packing), Route management, Blanket orders, Volume pricing, Container tracking |
| **Service Business** | Projects, Timesheets, Helpdesk, Subscription billing, Service contracts |

### How We Handle This in ONE Software
1. **Module activation per tenant** — each company enables only the modules they need
2. **POS type configuration** — same POS module, different modes (retail vs. restaurant)
3. **Inventory tracking is configurable** — enable/disable variants, serial, lot per product
4. **Manufacturing is optional** — only shown when enabled
5. **Custom fields** — each industry can add their own fields without code changes
6. **Flexible product types** — stockable (physical), consumable, service, digital
7. **Industry templates** — pre-configured setups for common industries (chart of accounts, tax rates, default categories, product templates)

---

## 17. Integration & Extensibility

### Webhook System
```
WebhookEndpoint {
  id: UUID
  company_id: UUID
  url: string
  secret: string
  events: string[] (['sales.order.confirmed', 'inventory.stock.low', ...])
  is_active: boolean
  last_triggered_at: timestamp
  failure_count: integer
}
```
Modules emit events → Webhook service fans out to registered endpoints.

### API Keys
```
APIKey {
  id: UUID
  company_id: UUID
  name: string
  key_hash: string
  permissions: string[] (same as RBAC permissions)
  expires_at: timestamp
  is_active: boolean
  last_used_at: timestamp
  created_by: UUID
}
```

### Plugin Architecture (Future)
- Plugins register via a manifest file
- Can add: routes, services, schema extensions, UI components, sidebar items
- Sandboxed execution
- Plugin marketplace (future)

### External Integrations (Future-Ready)
- **Payment Gateways**: Stripe, PayPal, local gateways
- **Shipping**: UPS, FedEx, DHL, local carriers
- **Accounting Export**: QuickBooks, Xero format export
- **E-Commerce**: Shopify, WooCommerce sync
- **Communication**: Twilio (SMS), SendGrid (Email), WhatsApp Business
- **Government**: Tax filing APIs (country-specific)
- **Banking**: Open Banking APIs for auto bank statement import

---

## 18. Testing Strategy

### Unit Tests (Vitest)
- Test all service layer functions
- Test all validators (Zod schemas)
- Test utility functions
- Mock database calls

### Integration Tests (Vitest + Drizzle test utils)
- Test API routes with real database (test DB)
- Test cross-module interactions (e.g., SO → Delivery → Invoice → GL)
- Test permission enforcement
- Test multi-tenant isolation

### E2E Tests (Playwright)
- Critical user flows:
  - Login → Create contact → Create SO → Confirm → Deliver → Invoice → Payment
  - POS session open → sell items → payment → close session
  - Manufacturing: Create BOM → Create MO → Consume → Produce
- Run against a seeded test database

### Test Naming Convention
```
describe('SalesService', () => {
  it('should create a quotation with valid data', async () => { ... });
  it('should reject quotation without customer', async () => { ... });
  it('should not allow cross-tenant access', async () => { ... });
});
```

---

## 19. Deployment & DevOps

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/nexterp

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# File Storage
S3_ENDPOINT=...
S3_BUCKET=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Email
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=NextERP
```

### Deployment Options
1. **Vercel** — easiest for Next.js (with external PostgreSQL + Redis)
2. **Docker** — `docker-compose.yml` with app + PostgreSQL + Redis + MinIO
3. **Self-hosted** — PM2 or systemd on a VPS
4. **Kubernetes** — for large-scale enterprise

### Docker Compose (Development)
```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env.local
    depends_on: [db, redis, minio]
  db:
    image: postgres:17
    environment:
      POSTGRES_DB: nexterp
      POSTGRES_USER: nexterp
      POSTGRES_PASSWORD: nexterp
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
volumes:
  pgdata:
```

---

## 20. Conventions & Rules for AI Agents

### Code Style
- **TypeScript strict mode** — no `any`, no implicit returns
- **Functional components** — no class components
- **Named exports** — no default exports (except pages)
- **Barrel exports** — `index.ts` in each folder
- **Absolute imports** — `@/lib/...`, `@/components/...`
- **camelCase** for variables/functions, **PascalCase** for components/types, **UPPER_SNAKE_CASE** for constants
- **snake_case** for database columns (Drizzle maps to camelCase in TypeScript)

### File Naming
- **Components**: `kebab-case.tsx` (e.g., `contact-form.tsx`)
- **Services**: `module-name.service.ts`
- **Validators**: `module-name.validator.ts`
- **Schemas**: `module-name.ts` (in `lib/db/schema/`)
- **Hooks**: `use-hook-name.ts`
- **Stores**: `module-name.store.ts`
- **Tests**: `module-name.test.ts` or `module-name.spec.ts`

### Database Conventions
- Table names: **plural snake_case** (e.g., `sales_orders`, `purchase_order_lines`)
- Column names: **snake_case** (e.g., `created_at`, `company_id`)
- Primary keys: `id` (UUID, generated by default)
- Foreign keys: `related_table_singular_id` (e.g., `contact_id`, `warehouse_id`)
- Every table has: `id`, `company_id`, `created_at`, `updated_at`, `created_by`, `updated_by`
- Soft delete columns: `is_deleted`, `deleted_at`, `deleted_by`
- Use PostgreSQL enums for status fields
- Use JSONB for flexible/custom data
- Indexes on: `company_id`, all foreign keys, status fields, frequently filtered columns

### Service Layer Rules
```typescript
// Every service extends BaseService which handles:
// - Tenant isolation (company_id filtering)
// - Audit logging
// - Soft deletes
// - Pagination, sorting, filtering

class SalesService extends BaseService<SalesOrder> {
  // Public methods = business operations
  async createQuotation(data: CreateQuotationInput): Promise<SalesOrder> { }
  async confirmOrder(orderId: string): Promise<SalesOrder> { }
  
  // Cross-module calls go through other services (injected)
  // NEVER directly query another module's tables
  private inventoryService: InventoryService;
  private accountingService: AccountingService;
}
```

### API Route Rules
```typescript
// app/api/v1/sales/orders/route.ts
import { requireAuth, requirePermission } from '@/lib/middleware';
import { salesService } from '@/lib/services';
import { createSalesOrderSchema } from '@/lib/validators';

export async function GET(request: Request) {
  const session = await requireAuth();
  await requirePermission(session, 'sales:order:read');
  // Parse query params for pagination/filtering
  const result = await salesService.list(session.companyId, queryParams);
  return Response.json({ success: true, data: result.data, meta: result.meta });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  await requirePermission(session, 'sales:order:create');
  const body = await request.json();
  const validated = createSalesOrderSchema.parse(body);
  const result = await salesService.createQuotation(session.companyId, session.userId, validated);
  return Response.json({ success: true, data: result }, { status: 201 });
}
```

### Component Rules
```typescript
// 1. Server Components by default (no 'use client' unless needed)
// 2. Client Components only for interactivity (forms, buttons, modals)
// 3. Shared components in /components/shared/
// 4. Module-specific components in /app/(erp)/[module]/components/
// 5. Never put business logic in components — call services/actions

// List Page Pattern (Server Component)
export default async function SalesOrdersPage({ searchParams }) {
  const orders = await salesService.list(companyId, searchParams);
  return <DataTable columns={columns} data={orders.data} meta={orders.meta} />;
}

// Form Pattern (Client Component)
'use client';
export function SalesOrderForm({ initialData, customers, products }) {
  const form = useForm({ resolver: zodResolver(salesOrderSchema), defaultValues: initialData });
  const onSubmit = async (data) => {
    await createSalesOrderAction(data); // Server Action
  };
  return <Form {...form}>...</Form>;
}
```

### Error Handling Pattern
```typescript
// Custom error classes
class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 400) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with ID ${id} not found`, 404);
  }
}

class ForbiddenError extends AppError {
  constructor() {
    super('FORBIDDEN', 'You do not have permission to perform this action', 403);
  }
}

class ValidationError extends AppError {
  constructor(public details: Array<{ field: string; message: string }>) {
    super('VALIDATION_ERROR', 'Validation failed', 422);
  }
}

// Global error handler in API routes
function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ success: false, error: { code: error.code, message: error.message, details: error.details } }, { status: error.statusCode });
  }
  console.error('Unhandled error:', error);
  return Response.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
}
```

### Cross-Module Communication Rules
1. **NEVER import another module's DB schema directly** — always go through the service layer
2. **Use events for loosely-coupled side effects** (e.g., "sales.order.confirmed" → triggers delivery creation, accounting entry)
3. **Use direct service calls for tightly-coupled operations** (e.g., creating invoice line items from sales order lines)
4. **Document all cross-module dependencies** in each service file header

### Event System
```typescript
// lib/events/index.ts
type EventMap = {
  'sales.order.confirmed': { orderId: string; companyId: string };
  'inventory.stock.low': { productId: string; warehouseId: string; currentQty: number; minQty: number };
  'manufacturing.order.completed': { orderId: string; productId: string; quantity: number };
  'accounting.invoice.paid': { invoiceId: string; paymentId: string };
  // ... etc
};

// Emit
await events.emit('sales.order.confirmed', { orderId, companyId });

// Listen (registered at app startup)
events.on('sales.order.confirmed', async (data) => {
  await inventoryService.reserveStock(data.orderId);
  await warehouseService.createDeliveryOrder(data.orderId);
});
```

### Git Commit Convention
```
feat(sales): add quotation PDF generation
fix(inventory): correct stock level calculation on partial delivery
refactor(accounting): extract journal entry creation to shared util
docs(manufacturing): add BOM import specification
test(pos): add offline sync E2E tests
chore: upgrade shadcn/ui components
```

---

## Summary

This document defines a **complete, enterprise-grade ERP system** with **20 modules** covering the full spectrum of business operations. The architecture is:

- **Modular**: Each module is self-contained with clear interfaces
- **Scalable**: Multi-tenant SaaS with proper isolation
- **Secure**: RBAC down to field level, audit logging, encrypted sessions
- **Extensible**: Custom fields, webhooks, plugin-ready architecture
- **Universal**: Common core with industry-specific configurations
- **Modern**: Next.js 16, TypeScript, shadcn/ui, PostgreSQL, Drizzle ORM

Any developer or AI coding agent should be able to pick up this document and implement any module independently, following the patterns and conventions defined here.

**Start with Phase 0 (Foundation), then systematically work through each phase.**
