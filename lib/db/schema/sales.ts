import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    jsonb,
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

export const salesOrderStatusEnum = pgEnum("sales_order_status", [
    "draft",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
]);

export const quotationStatusEnum = pgEnum("quotation_status", [
    "draft",
    "sent",
    "accepted",
    "rejected",
    "expired",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
    "draft",
    "sent",
    "partially_paid",
    "paid",
    "overdue",
    "cancelled",
    "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
    "cash",
    "bank_transfer",
    "credit_card",
    "check",
    "online",
    "other",
]);

// ============================================================================
// QUOTATIONS
// ============================================================================

export const quotations = pgTable(
    "quotations",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        number: varchar("number", { length: 50 }).notNull(), // e.g. QT-0001
        customerId: uuid("customer_id")
            .notNull()
            .references(() => contacts.id),
        status: quotationStatusEnum("status").default("draft").notNull(),

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

        // Conversion to SO
        salesOrderId: uuid("sales_order_id"),

        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("quotations_company_idx").on(t.companyId),
        index("quotations_customer_idx").on(t.customerId),
        index("quotations_status_idx").on(t.companyId, t.status),
    ]
);

// ============================================================================
// QUOTATION LINES
// ============================================================================

export const quotationLines = pgTable(
    "quotation_lines",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        quotationId: uuid("quotation_id")
            .notNull()
            .references(() => quotations.id, { onDelete: "cascade" }),
        productId: uuid("product_id").references(() => products.id),
        description: text("description").notNull(),
        quantity: numeric("quantity", { precision: 15, scale: 4 }).default("1").notNull(),
        unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).default("0").notNull(),
        discount: numeric("discount", { precision: 5, scale: 2 }).default("0"), // percentage
        taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
        lineTotal: numeric("line_total", { precision: 15, scale: 2 }).default("0").notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
    },
    (t) => [index("quotation_lines_quotation_idx").on(t.quotationId)]
);

// ============================================================================
// SALES ORDERS
// ============================================================================

export const salesOrders = pgTable(
    "sales_orders",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        number: varchar("number", { length: 50 }).notNull(), // e.g. SO-0001
        customerId: uuid("customer_id")
            .notNull()
            .references(() => contacts.id),
        quotationId: uuid("quotation_id").references(() => quotations.id),
        status: salesOrderStatusEnum("status").default("draft").notNull(),

        // Dates
        orderDate: timestamp("order_date", { withTimezone: true }).defaultNow().notNull(),
        deliveryDate: timestamp("delivery_date", { withTimezone: true }),

        // Shipping
        shippingAddress: text("shipping_address"),
        shippingMethod: varchar("shipping_method", { length: 100 }),
        trackingNumber: varchar("tracking_number", { length: 255 }),

        // Totals
        subtotal: numeric("subtotal", { precision: 15, scale: 2 }).default("0").notNull(),
        taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0").notNull(),
        shippingCost: numeric("shipping_cost", { precision: 15, scale: 2 }).default("0"),
        discount: numeric("discount", { precision: 15, scale: 2 }).default("0").notNull(),
        total: numeric("total", { precision: 15, scale: 2 }).default("0").notNull(),
        amountPaid: numeric("amount_paid", { precision: 15, scale: 2 }).default("0").notNull(),

        currency: varchar("currency", { length: 3 }).default("USD").notNull(),
        notes: text("notes"),
        terms: text("terms"),

        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("sales_orders_company_idx").on(t.companyId),
        index("sales_orders_customer_idx").on(t.customerId),
        index("sales_orders_status_idx").on(t.companyId, t.status),
        index("sales_orders_date_idx").on(t.orderDate),
    ]
);

// ============================================================================
// SALES ORDER LINES
// ============================================================================

export const salesOrderLines = pgTable(
    "sales_order_lines",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        salesOrderId: uuid("sales_order_id")
            .notNull()
            .references(() => salesOrders.id, { onDelete: "cascade" }),
        productId: uuid("product_id").references(() => products.id),
        description: text("description").notNull(),
        quantity: numeric("quantity", { precision: 15, scale: 4 }).default("1").notNull(),
        deliveredQty: numeric("delivered_qty", { precision: 15, scale: 4 }).default("0"),
        unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).default("0").notNull(),
        discount: numeric("discount", { precision: 5, scale: 2 }).default("0"),
        taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
        lineTotal: numeric("line_total", { precision: 15, scale: 2 }).default("0").notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
    },
    (t) => [index("sales_order_lines_order_idx").on(t.salesOrderId)]
);

// ============================================================================
// INVOICES
// ============================================================================

export const invoices = pgTable(
    "invoices",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        number: varchar("number", { length: 50 }).notNull(), // e.g. INV-0001
        customerId: uuid("customer_id")
            .notNull()
            .references(() => contacts.id),
        salesOrderId: uuid("sales_order_id").references(() => salesOrders.id),
        status: invoiceStatusEnum("status").default("draft").notNull(),

        // Dates
        issueDate: timestamp("issue_date", { withTimezone: true }).defaultNow().notNull(),
        dueDate: timestamp("due_date", { withTimezone: true }),

        // Totals
        subtotal: numeric("subtotal", { precision: 15, scale: 2 }).default("0").notNull(),
        taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0").notNull(),
        discount: numeric("discount", { precision: 15, scale: 2 }).default("0").notNull(),
        total: numeric("total", { precision: 15, scale: 2 }).default("0").notNull(),
        amountPaid: numeric("amount_paid", { precision: 15, scale: 2 }).default("0").notNull(),
        balanceDue: numeric("balance_due", { precision: 15, scale: 2 }).default("0").notNull(),

        currency: varchar("currency", { length: 3 }).default("USD").notNull(),
        notes: text("notes"),
        terms: text("terms"),

        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("invoices_company_idx").on(t.companyId),
        index("invoices_customer_idx").on(t.customerId),
        index("invoices_status_idx").on(t.companyId, t.status),
        index("invoices_due_date_idx").on(t.dueDate),
    ]
);

// ============================================================================
// INVOICE LINES
// ============================================================================

export const invoiceLines = pgTable(
    "invoice_lines",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        invoiceId: uuid("invoice_id")
            .notNull()
            .references(() => invoices.id, { onDelete: "cascade" }),
        productId: uuid("product_id").references(() => products.id),
        description: text("description").notNull(),
        quantity: numeric("quantity", { precision: 15, scale: 4 }).default("1").notNull(),
        unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).default("0").notNull(),
        discount: numeric("discount", { precision: 5, scale: 2 }).default("0"),
        taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
        lineTotal: numeric("line_total", { precision: 15, scale: 2 }).default("0").notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
    },
    (t) => [index("invoice_lines_invoice_idx").on(t.invoiceId)]
);

// ============================================================================
// PAYMENTS
// ============================================================================

export const payments = pgTable(
    "payments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        number: varchar("number", { length: 50 }).notNull(), // PAY-0001
        invoiceId: uuid("invoice_id").references(() => invoices.id),
        customerId: uuid("customer_id").references(() => contacts.id),
        amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
        currency: varchar("currency", { length: 3 }).default("USD").notNull(),
        method: paymentMethodEnum("method").default("cash").notNull(),
        reference: varchar("reference", { length: 255 }),
        notes: text("notes"),
        paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("payments_company_idx").on(t.companyId),
        index("payments_invoice_idx").on(t.invoiceId),
        index("payments_customer_idx").on(t.customerId),
    ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
    company: one(companies, { fields: [quotations.companyId], references: [companies.id] }),
    customer: one(contacts, { fields: [quotations.customerId], references: [contacts.id] }),
    createdByUser: one(users, { fields: [quotations.createdBy], references: [users.id] }),
    lines: many(quotationLines),
}));

export const quotationLinesRelations = relations(quotationLines, ({ one }) => ({
    quotation: one(quotations, { fields: [quotationLines.quotationId], references: [quotations.id] }),
    product: one(products, { fields: [quotationLines.productId], references: [products.id] }),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
    company: one(companies, { fields: [salesOrders.companyId], references: [companies.id] }),
    customer: one(contacts, { fields: [salesOrders.customerId], references: [contacts.id] }),
    quotation: one(quotations, { fields: [salesOrders.quotationId], references: [quotations.id] }),
    createdByUser: one(users, { fields: [salesOrders.createdBy], references: [users.id] }),
    lines: many(salesOrderLines),
    invoices: many(invoices),
}));

export const salesOrderLinesRelations = relations(salesOrderLines, ({ one }) => ({
    salesOrder: one(salesOrders, { fields: [salesOrderLines.salesOrderId], references: [salesOrders.id] }),
    product: one(products, { fields: [salesOrderLines.productId], references: [products.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    company: one(companies, { fields: [invoices.companyId], references: [companies.id] }),
    customer: one(contacts, { fields: [invoices.customerId], references: [contacts.id] }),
    salesOrder: one(salesOrders, { fields: [invoices.salesOrderId], references: [salesOrders.id] }),
    createdByUser: one(users, { fields: [invoices.createdBy], references: [users.id] }),
    lines: many(invoiceLines),
    payments: many(payments),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
    invoice: one(invoices, { fields: [invoiceLines.invoiceId], references: [invoices.id] }),
    product: one(products, { fields: [invoiceLines.productId], references: [products.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    company: one(companies, { fields: [payments.companyId], references: [companies.id] }),
    invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
    customer: one(contacts, { fields: [payments.customerId], references: [contacts.id] }),
    createdByUser: one(users, { fields: [payments.createdBy], references: [users.id] }),
}));
