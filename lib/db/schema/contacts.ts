import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    jsonb,
    index,
    pgEnum,
    numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, users } from "./core";

// ============================================================================
// ENUMS
// ============================================================================

export const contactTypeEnum = pgEnum("contact_type", [
    "customer",
    "vendor",
    "customer_vendor", // both
    "employee",
    "other",
]);

// ============================================================================
// CONTACTS — People & Organizations
// ============================================================================

export const contacts = pgTable(
    "contacts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),

        // Type
        type: contactTypeEnum("type").default("customer").notNull(),
        isOrganization: boolean("is_organization").default(false).notNull(),
        parentId: uuid("parent_id"), // if this is a sub-contact of an organization

        // Basic info
        name: varchar("name", { length: 255 }).notNull(),
        displayName: varchar("display_name", { length: 255 }),
        email: varchar("email", { length: 255 }),
        phone: varchar("phone", { length: 50 }),
        mobile: varchar("mobile", { length: 50 }),
        website: varchar("website", { length: 255 }),
        taxId: varchar("tax_id", { length: 100 }),

        // Organization role (for individual contacts under an org)
        jobTitle: varchar("job_title", { length: 100 }),
        department: varchar("department", { length: 100 }),

        // Address
        street: varchar("street", { length: 255 }),
        street2: varchar("street2", { length: 255 }),
        city: varchar("city", { length: 100 }),
        state: varchar("state", { length: 100 }),
        zip: varchar("zip", { length: 20 }),
        country: varchar("country", { length: 2 }),

        // Financial
        currency: varchar("currency", { length: 3 }).default("USD"),
        creditLimit: numeric("credit_limit", { precision: 15, scale: 2 }).default("0"),
        paymentTermDays: varchar("payment_term_days", { length: 20 }).default("30"),

        // Meta
        tags: jsonb("tags").default([]).$type<string[]>(),
        notes: text("notes"),
        avatar: text("avatar"),
        isActive: boolean("is_active").default(true).notNull(),

        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("contacts_company_idx").on(t.companyId),
        index("contacts_type_idx").on(t.companyId, t.type),
        index("contacts_name_idx").on(t.companyId, t.name),
        index("contacts_parent_idx").on(t.parentId),
        index("contacts_company_created_idx").on(t.companyId, t.createdAt),
    ]
);

// ============================================================================
// CONTACT ADDRESSES (multiple addresses per contact)
// ============================================================================

export const contactAddresses = pgTable(
    "contact_addresses",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        contactId: uuid("contact_id")
            .notNull()
            .references(() => contacts.id, { onDelete: "cascade" }),
        label: varchar("label", { length: 50 }).default("default").notNull(), // 'billing', 'shipping', 'default'
        street: varchar("street", { length: 255 }),
        street2: varchar("street2", { length: 255 }),
        city: varchar("city", { length: 100 }),
        state: varchar("state", { length: 100 }),
        zip: varchar("zip", { length: 20 }),
        country: varchar("country", { length: 2 }),
        isDefault: boolean("is_default").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [index("contact_addresses_contact_idx").on(t.contactId)]
);

// ============================================================================
// CONTACT BANK ACCOUNTS
// ============================================================================

export const contactBankAccounts = pgTable(
    "contact_bank_accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        contactId: uuid("contact_id")
            .notNull()
            .references(() => contacts.id, { onDelete: "cascade" }),
        bankName: varchar("bank_name", { length: 255 }).notNull(),
        accountName: varchar("account_name", { length: 255 }),
        accountNumber: varchar("account_number", { length: 100 }),
        iban: varchar("iban", { length: 34 }),
        swift: varchar("swift", { length: 11 }),
        routingNumber: varchar("routing_number", { length: 20 }),
        isDefault: boolean("is_default").default(false).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [index("contact_bank_contact_idx").on(t.contactId)]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const contactsRelations = relations(contacts, ({ one, many }) => ({
    company: one(companies, {
        fields: [contacts.companyId],
        references: [companies.id],
    }),
    parent: one(contacts, {
        fields: [contacts.parentId],
        references: [contacts.id],
        relationName: "parentChild",
    }),
    children: many(contacts, { relationName: "parentChild" }),
    createdByUser: one(users, {
        fields: [contacts.createdBy],
        references: [users.id],
    }),
    addresses: many(contactAddresses),
    bankAccounts: many(contactBankAccounts),
}));

export const contactAddressesRelations = relations(contactAddresses, ({ one }) => ({
    contact: one(contacts, {
        fields: [contactAddresses.contactId],
        references: [contacts.id],
    }),
}));

export const contactBankAccountsRelations = relations(contactBankAccounts, ({ one }) => ({
    contact: one(contacts, {
        fields: [contactBankAccounts.contactId],
        references: [contacts.id],
    }),
}));
