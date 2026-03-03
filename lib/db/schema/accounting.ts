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

// ============================================================================
// ENUMS
// ============================================================================

export const accountTypeEnum = pgEnum("account_type", [
    "asset",
    "liability",
    "equity",
    "revenue",
    "expense",
]);

export const journalEntryStatusEnum = pgEnum("journal_entry_status", [
    "draft",
    "posted",
    "cancelled",
]);

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================

export const chartOfAccounts = pgTable(
    "chart_of_accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        code: varchar("code", { length: 20 }).notNull(),
        name: varchar("name", { length: 200 }).notNull(),
        type: accountTypeEnum("type").notNull(),
        parentId: uuid("parent_id"),
        description: text("description"),
        currency: varchar("currency", { length: 3 }).default("USD"),
        isActive: boolean("is_active").default(true),
        isReconcilable: boolean("is_reconcilable").default(false),
        balance: numeric("balance", { precision: 15, scale: 2 }).default("0"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("coa_company_idx").on(table.companyId),
        index("coa_code_idx").on(table.companyId, table.code),
        index("coa_type_idx").on(table.type),
    ]
);

// ============================================================================
// JOURNAL ENTRIES
// ============================================================================

export const journalEntries = pgTable(
    "journal_entries",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        number: varchar("number", { length: 50 }).notNull(),
        date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
        status: journalEntryStatusEnum("status").default("draft").notNull(),
        reference: varchar("reference", { length: 100 }),
        description: text("description"),
        totalDebit: numeric("total_debit", { precision: 15, scale: 2 }).default("0"),
        totalCredit: numeric("total_credit", { precision: 15, scale: 2 }).default("0"),
        currency: varchar("currency", { length: 3 }).default("USD"),
        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("je_company_idx").on(table.companyId),
        index("je_date_idx").on(table.date),
        index("je_status_idx").on(table.status),
    ]
);

// ============================================================================
// JOURNAL ENTRY LINES
// ============================================================================

export const journalEntryLines = pgTable(
    "journal_entry_lines",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        journalEntryId: uuid("journal_entry_id")
            .notNull()
            .references(() => journalEntries.id, { onDelete: "cascade" }),
        accountId: uuid("account_id")
            .notNull()
            .references(() => chartOfAccounts.id),
        description: text("description"),
        debit: numeric("debit", { precision: 15, scale: 2 }).default("0"),
        credit: numeric("credit", { precision: 15, scale: 2 }).default("0"),
        sortOrder: integer("sort_order").default(0),
    },
    (table) => [
        index("jel_entry_idx").on(table.journalEntryId),
        index("jel_account_idx").on(table.accountId),
    ]
);

// ============================================================================
// TAX RATES
// ============================================================================

export const taxRates = pgTable(
    "tax_rates",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 100 }).notNull(),
        rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
        description: text("description"),
        isActive: boolean("is_active").default(true),
        isDefault: boolean("is_default").default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [index("tax_company_idx").on(table.companyId)]
);

// ============================================================================
// FISCAL YEARS
// ============================================================================

export const fiscalYears = pgTable(
    "fiscal_years",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 50 }).notNull(),
        startDate: timestamp("start_date", { withTimezone: true }).notNull(),
        endDate: timestamp("end_date", { withTimezone: true }).notNull(),
        isClosed: boolean("is_closed").default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [index("fy_company_idx").on(table.companyId)]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
    company: one(companies, { fields: [chartOfAccounts.companyId], references: [companies.id] }),
    parent: one(chartOfAccounts, { fields: [chartOfAccounts.parentId], references: [chartOfAccounts.id] }),
    journalLines: many(journalEntryLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
    company: one(companies, { fields: [journalEntries.companyId], references: [companies.id] }),
    createdByUser: one(users, { fields: [journalEntries.createdBy], references: [users.id] }),
    lines: many(journalEntryLines),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
    journalEntry: one(journalEntries, { fields: [journalEntryLines.journalEntryId], references: [journalEntries.id] }),
    account: one(chartOfAccounts, { fields: [journalEntryLines.accountId], references: [chartOfAccounts.id] }),
}));

export const taxRatesRelations = relations(taxRates, ({ one }) => ({
    company: one(companies, { fields: [taxRates.companyId], references: [companies.id] }),
}));

export const fiscalYearsRelations = relations(fiscalYears, ({ one }) => ({
    company: one(companies, { fields: [fiscalYears.companyId], references: [companies.id] }),
}));
