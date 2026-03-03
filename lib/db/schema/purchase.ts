import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    integer,
    numeric,
    index,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, users } from "./core";
import { contacts } from "./contacts";
import { products } from "./inventory";

// ============================================================================
// ENUMS
// ============================================================================

export const purchaseOrderStatusEnum = pgEnum("purchase_order_status", [
    "draft",
    "sent",
    "confirmed",
    "received",
    "partially_received",
    "cancelled",
]);

export const vendorBillStatusEnum = pgEnum("vendor_bill_status", [
    "draft",
    "received",
    "partially_paid",
    "paid",
    "overdue",
    "cancelled",
]);

export const rfqStatusEnum = pgEnum("rfq_status", [
    "draft",
    "sent",
    "quoted",
    "accepted",
    "rejected",
    "expired",
]);

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export const purchaseOrders = pgTable(
    "purchase_orders",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        number: varchar("number", { length: 50 }).notNull(),
        vendorId: uuid("vendor_id")
            .notNull()
            .references(() => contacts.id),
        status: purchaseOrderStatusEnum("status").default("draft").notNull(),

        // Dates
        orderDate: timestamp("order_date", { withTimezone: true }).defaultNow().notNull(),
        expectedDate: timestamp("expected_date", { withTimezone: true }),
        receivedDate: timestamp("received_date", { withTimezone: true }),

        // Totals
        subtotal: numeric("subtotal", { precision: 15, scale: 2 }).default("0"),
        taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0"),
        discount: numeric("discount", { precision: 15, scale: 2 }).default("0"),
        total: numeric("total", { precision: 15, scale: 2 }).default("0"),
        amountPaid: numeric("amount_paid", { precision: 15, scale: 2 }).default("0"),

        // Details
        currency: varchar("currency", { length: 3 }).default("USD"),
        shippingAddress: text("shipping_address"),
        notes: text("notes"),
        terms: text("terms"),

        // Tracking
        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("po_company_idx").on(table.companyId),
        index("po_vendor_idx").on(table.vendorId),
        index("po_status_idx").on(table.status),
        index("po_order_date_idx").on(table.orderDate),
    ]
);

// ============================================================================
// PURCHASE ORDER LINES
// ============================================================================

export const purchaseOrderLines = pgTable(
    "purchase_order_lines",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        purchaseOrderId: uuid("purchase_order_id")
            .notNull()
            .references(() => purchaseOrders.id, { onDelete: "cascade" }),
        productId: uuid("product_id").references(() => products.id),
        description: text("description").notNull(),
        quantity: numeric("quantity", { precision: 15, scale: 4 }).default("1"),
        unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).default("0"),
        discount: numeric("discount", { precision: 5, scale: 2 }).default("0"),
        taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
        lineTotal: numeric("line_total", { precision: 15, scale: 2 }).default("0"),
        receivedQty: numeric("received_qty", { precision: 15, scale: 4 }).default("0"),
        sortOrder: integer("sort_order").default(0),
    },
    (table) => [index("po_line_order_idx").on(table.purchaseOrderId)]
);

// ============================================================================
// VENDOR BILLS
// ============================================================================

export const vendorBills = pgTable(
    "vendor_bills",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        number: varchar("number", { length: 50 }).notNull(),
        vendorId: uuid("vendor_id")
            .notNull()
            .references(() => contacts.id),
        purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
        status: vendorBillStatusEnum("status").default("draft").notNull(),

        // Dates
        billDate: timestamp("bill_date", { withTimezone: true }).defaultNow().notNull(),
        dueDate: timestamp("due_date", { withTimezone: true }),

        // Totals
        subtotal: numeric("subtotal", { precision: 15, scale: 2 }).default("0"),
        taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0"),
        total: numeric("total", { precision: 15, scale: 2 }).default("0"),
        amountPaid: numeric("amount_paid", { precision: 15, scale: 2 }).default("0"),

        // Details
        currency: varchar("currency", { length: 3 }).default("USD"),
        reference: varchar("reference", { length: 100 }),
        notes: text("notes"),

        // Tracking
        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("vb_company_idx").on(table.companyId),
        index("vb_vendor_idx").on(table.vendorId),
        index("vb_status_idx").on(table.status),
    ]
);

// ============================================================================
// VENDOR BILL LINES
// ============================================================================

export const vendorBillLines = pgTable(
    "vendor_bill_lines",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        vendorBillId: uuid("vendor_bill_id")
            .notNull()
            .references(() => vendorBills.id, { onDelete: "cascade" }),
        productId: uuid("product_id").references(() => products.id),
        description: text("description").notNull(),
        quantity: numeric("quantity", { precision: 15, scale: 4 }).default("1"),
        unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).default("0"),
        taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
        lineTotal: numeric("line_total", { precision: 15, scale: 2 }).default("0"),
        sortOrder: integer("sort_order").default(0),
    },
    (table) => [index("vbl_bill_idx").on(table.vendorBillId)]
);

// ============================================================================
// VENDOR PAYMENTS
// ============================================================================

export const vendorPayments = pgTable(
    "vendor_payments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        vendorBillId: uuid("vendor_bill_id").references(() => vendorBills.id),
        vendorId: uuid("vendor_id")
            .notNull()
            .references(() => contacts.id),
        amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
        currency: varchar("currency", { length: 3 }).default("USD"),
        paymentDate: timestamp("payment_date", { withTimezone: true }).defaultNow().notNull(),
        method: varchar("method", { length: 30 }),
        reference: varchar("reference", { length: 100 }),
        notes: text("notes"),
        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("vp_company_idx").on(table.companyId),
        index("vp_vendor_idx").on(table.vendorId),
        index("vp_bill_idx").on(table.vendorBillId),
    ]
);

// ============================================================================
// REQUEST FOR QUOTATION (RFQ)
// ============================================================================

export const rfqs = pgTable(
    "rfqs",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        number: varchar("number", { length: 50 }).notNull(), // e.g. RFQ-0001
        vendorId: uuid("vendor_id")
            .notNull()
            .references(() => contacts.id),
        status: rfqStatusEnum("status").default("draft").notNull(),

        // Dates
        date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
        validUntil: timestamp("valid_until", { withTimezone: true }),

        // Totals
        subtotal: numeric("subtotal", { precision: 15, scale: 2 }).default("0").notNull(),
        taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0").notNull(),
        discount: numeric("discount", { precision: 15, scale: 2 }).default("0").notNull(),
        total: numeric("total", { precision: 15, scale: 2 }).default("0").notNull(),

        currency: varchar("currency", { length: 3 }).default("USD").notNull(),
        notes: text("notes"),
        terms: text("terms"),

        // Conversion to PO
        purchaseOrderId: uuid("purchase_order_id"),

        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("rfqs_company_idx").on(t.companyId),
        index("rfqs_vendor_idx").on(t.vendorId),
        index("rfqs_status_idx").on(t.companyId, t.status),
    ]
);

// ============================================================================
// RFQ LINES
// ============================================================================

export const rfqLines = pgTable(
    "rfq_lines",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        rfqId: uuid("rfq_id")
            .notNull()
            .references(() => rfqs.id, { onDelete: "cascade" }),
        productId: uuid("product_id").references(() => products.id),
        description: text("description").notNull(),
        quantity: numeric("quantity", { precision: 15, scale: 4 }).default("1").notNull(),
        unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).default("0"), // filled after vendor quotes
        discount: numeric("discount", { precision: 5, scale: 2 }).default("0"), // percentage
        taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
        lineTotal: numeric("line_total", { precision: 15, scale: 2 }).default("0").notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
    },
    (t) => [index("rfq_lines_rfq_idx").on(t.rfqId)]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    company: one(companies, { fields: [purchaseOrders.companyId], references: [companies.id] }),
    vendor: one(contacts, { fields: [purchaseOrders.vendorId], references: [contacts.id] }),
    createdByUser: one(users, { fields: [purchaseOrders.createdBy], references: [users.id] }),
    lines: many(purchaseOrderLines),
    bills: many(vendorBills),
}));

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderLines.purchaseOrderId], references: [purchaseOrders.id] }),
    product: one(products, { fields: [purchaseOrderLines.productId], references: [products.id] }),
}));

export const vendorBillsRelations = relations(vendorBills, ({ one, many }) => ({
    company: one(companies, { fields: [vendorBills.companyId], references: [companies.id] }),
    vendor: one(contacts, { fields: [vendorBills.vendorId], references: [contacts.id] }),
    purchaseOrder: one(purchaseOrders, { fields: [vendorBills.purchaseOrderId], references: [purchaseOrders.id] }),
    createdByUser: one(users, { fields: [vendorBills.createdBy], references: [users.id] }),
    lines: many(vendorBillLines),
    payments: many(vendorPayments),
}));

export const vendorBillLinesRelations = relations(vendorBillLines, ({ one }) => ({
    bill: one(vendorBills, { fields: [vendorBillLines.vendorBillId], references: [vendorBills.id] }),
    product: one(products, { fields: [vendorBillLines.productId], references: [products.id] }),
}));

export const vendorPaymentsRelations = relations(vendorPayments, ({ one }) => ({
    company: one(companies, { fields: [vendorPayments.companyId], references: [companies.id] }),
    vendor: one(contacts, { fields: [vendorPayments.vendorId], references: [contacts.id] }),
    bill: one(vendorBills, { fields: [vendorPayments.vendorBillId], references: [vendorBills.id] }),
    createdByUser: one(users, { fields: [vendorPayments.createdBy], references: [users.id] }),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
    company: one(companies, { fields: [rfqs.companyId], references: [companies.id] }),
    vendor: one(contacts, { fields: [rfqs.vendorId], references: [contacts.id] }),
    purchaseOrder: one(purchaseOrders, { fields: [rfqs.purchaseOrderId], references: [purchaseOrders.id] }),
    createdByUser: one(users, { fields: [rfqs.createdBy], references: [users.id] }),
    lines: many(rfqLines),
}));

export const rfqLinesRelations = relations(rfqLines, ({ one }) => ({
    rfq: one(rfqs, { fields: [rfqLines.rfqId], references: [rfqs.id] }),
    product: one(products, { fields: [rfqLines.productId], references: [products.id] }),
}));
