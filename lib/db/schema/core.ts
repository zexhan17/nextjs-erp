import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    jsonb,
    integer,
    pgEnum,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const moduleCodeEnum = pgEnum("module_code", [
    "contacts",
    "crm",
    "sales",
    "purchase",
    "inventory",
    "warehouse",
    "manufacturing",
    "quality",
    "accounting",
    "pos",
    "hr",
    "projects",
    "helpdesk",
    "assets",
    "maintenance",
    "fleet",
    "documents",
    "reports",
    "subscriptions",
    "settings",
]);

export const userStatusEnum = pgEnum("user_status", [
    "active",
    "inactive",
    "suspended",
    "pending",
]);

// ============================================================================
// COMPANIES (Tenants)
// ============================================================================

export const companies = pgTable(
    "companies",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 100 }).notNull(),
        logo: text("logo"),
        email: varchar("email", { length: 255 }),
        phone: varchar("phone", { length: 50 }),
        website: varchar("website", { length: 255 }),
        taxId: varchar("tax_id", { length: 100 }),

        // Address
        street: varchar("street", { length: 255 }),
        street2: varchar("street2", { length: 255 }),
        city: varchar("city", { length: 100 }),
        state: varchar("state", { length: 100 }),
        zip: varchar("zip", { length: 20 }),
        country: varchar("country", { length: 2 }), // ISO country code

        // Settings
        currency: varchar("currency", { length: 3 }).default("USD").notNull(),
        timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
        dateFormat: varchar("date_format", { length: 20 }).default("YYYY-MM-DD").notNull(),
        fiscalYearStart: integer("fiscal_year_start").default(1).notNull(), // month 1-12
        language: varchar("language", { length: 10 }).default("en").notNull(),

        // Metadata
        settings: jsonb("settings").default({}).$type<Record<string, unknown>>(),
        isActive: boolean("is_active").default(true).notNull(),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("companies_slug_idx").on(t.slug),
    ]
);

// ============================================================================
// MODULE DEFINITIONS (what modules exist in the system)
// ============================================================================

export const moduleDefinitions = pgTable("module_definitions", {
    id: uuid("id").defaultRandom().primaryKey(),
    code: moduleCodeEnum("code").notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    category: varchar("category", { length: 50 }).notNull(), // 'core', 'operations', 'finance', 'people', 'support'
    dependsOn: jsonb("depends_on").default([]).$type<string[]>(), // module codes this depends on
    isCore: boolean("is_core").default(false).notNull(), // contacts, settings are always on
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(), // admin can globally disable
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// COMPANY MODULES (which modules a company has enabled)
// ============================================================================

export const companyModules = pgTable(
    "company_modules",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        moduleCode: moduleCodeEnum("module_code").notNull(),
        isEnabled: boolean("is_enabled").default(true).notNull(),
        enabledAt: timestamp("enabled_at", { withTimezone: true }).defaultNow(),
        enabledBy: uuid("enabled_by"),
        settings: jsonb("settings").default({}).$type<Record<string, unknown>>(),
    },
    (t) => [
        uniqueIndex("company_modules_unique_idx").on(t.companyId, t.moduleCode),
        index("company_modules_company_idx").on(t.companyId),
    ]
);

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        email: varchar("email", { length: 255 }).notNull(),
        emailVerified: timestamp("email_verified", { withTimezone: true }),
        passwordHash: text("password_hash"),
        name: varchar("name", { length: 255 }).notNull(),
        avatar: text("avatar"),
        phone: varchar("phone", { length: 50 }),
        status: userStatusEnum("status").default("active").notNull(),

        // Platform-level admin (can manage all companies)
        isSuperAdmin: boolean("is_super_admin").default(false).notNull(),

        // User preferences
        language: varchar("language", { length: 10 }).default("en"),
        timezone: varchar("timezone", { length: 50 }),
        theme: varchar("theme", { length: 10 }).default("system"),

        lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
        lastLoginIp: varchar("last_login_ip", { length: 45 }),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("users_email_idx").on(t.email),
    ]
);

// ============================================================================
// USER-COMPANY MEMBERSHIP (a user can belong to multiple companies)
// ============================================================================

export const userCompanies = pgTable(
    "user_companies",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        isOwner: boolean("is_owner").default(false).notNull(), // company owner
        isDefault: boolean("is_default").default(false).notNull(), // default company after login
        isActive: boolean("is_active").default(true).notNull(),
        joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("user_companies_unique_idx").on(t.userId, t.companyId),
        index("user_companies_user_idx").on(t.userId),
        index("user_companies_company_idx").on(t.companyId),
    ]
);

// ============================================================================
// ROLES
// ============================================================================

export const roles = pgTable(
    "roles",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 100 }).notNull(),
        description: text("description"),
        isSystem: boolean("is_system").default(false).notNull(), // built-in roles
        parentRoleId: uuid("parent_role_id"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("roles_company_idx").on(t.companyId),
    ]
);

// ============================================================================
// PERMISSIONS
// ============================================================================

export const permissions = pgTable(
    "permissions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        code: varchar("code", { length: 100 }).notNull().unique(), // e.g. 'sales:order:create'
        module: varchar("module", { length: 50 }).notNull(),
        resource: varchar("resource", { length: 50 }).notNull(),
        action: varchar("action", { length: 50 }).notNull(),
        description: text("description"),
    },
    (t) => [
        index("permissions_module_idx").on(t.module),
    ]
);

// ============================================================================
// ROLE ↔ PERMISSION (many-to-many)
// ============================================================================

export const rolePermissions = pgTable(
    "role_permissions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),
        permissionId: uuid("permission_id")
            .notNull()
            .references(() => permissions.id, { onDelete: "cascade" }),
    },
    (t) => [
        uniqueIndex("role_permissions_unique_idx").on(t.roleId, t.permissionId),
    ]
);

// ============================================================================
// USER ↔ ROLE per COMPANY
// ============================================================================

export const userRoles = pgTable(
    "user_roles",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        roleId: uuid("role_id")
            .notNull()
            .references(() => roles.id, { onDelete: "cascade" }),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
    },
    (t) => [
        uniqueIndex("user_roles_unique_idx").on(t.userId, t.roleId, t.companyId),
        index("user_roles_user_company_idx").on(t.userId, t.companyId),
    ]
);

// ============================================================================
// SESSIONS (for Auth.js)
// ============================================================================

export const sessions = pgTable(
    "sessions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        sessionToken: text("session_token").notNull().unique(),
        expires: timestamp("expires", { withTimezone: true }).notNull(),
        // Track active company in session
        activeCompanyId: uuid("active_company_id").references(() => companies.id),
    },
    (t) => [
        index("sessions_user_idx").on(t.userId),
    ]
);

// ============================================================================
// ACCOUNTS (OAuth - for Auth.js)
// ============================================================================

export const accounts = pgTable(
    "accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: varchar("type", { length: 50 }).notNull(),
        provider: varchar("provider", { length: 50 }).notNull(),
        providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
        refreshToken: text("refresh_token"),
        accessToken: text("access_token"),
        expiresAt: integer("expires_at"),
        tokenType: varchar("token_type", { length: 50 }),
        scope: text("scope"),
        idToken: text("id_token"),
        sessionState: text("session_state"),
    },
    (t) => [
        uniqueIndex("accounts_provider_idx").on(t.provider, t.providerAccountId),
        index("accounts_user_idx").on(t.userId),
    ]
);

// ============================================================================
// VERIFICATION TOKENS (for Auth.js)
// ============================================================================

export const verificationTokens = pgTable(
    "verification_tokens",
    {
        identifier: varchar("identifier", { length: 255 }).notNull(),
        token: text("token").notNull().unique(),
        expires: timestamp("expires", { withTimezone: true }).notNull(),
    },
    (t) => [
        uniqueIndex("verification_tokens_idx").on(t.identifier, t.token),
    ]
);

// ============================================================================
// AUDIT LOG
// ============================================================================

export const auditLogs = pgTable(
    "audit_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id").references(() => companies.id),
        userId: uuid("user_id").references(() => users.id),
        action: varchar("action", { length: 20 }).notNull(), // 'create', 'update', 'delete'
        module: varchar("module", { length: 50 }).notNull(),
        resource: varchar("resource", { length: 50 }).notNull(),
        resourceId: uuid("resource_id"),
        oldValues: jsonb("old_values").$type<Record<string, unknown>>(),
        newValues: jsonb("new_values").$type<Record<string, unknown>>(),
        ipAddress: varchar("ip_address", { length: 45 }),
        userAgent: text("user_agent"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("audit_logs_company_idx").on(t.companyId),
        index("audit_logs_user_idx").on(t.userId),
        index("audit_logs_resource_idx").on(t.module, t.resource, t.resourceId),
        index("audit_logs_created_idx").on(t.createdAt),
    ]
);

// ============================================================================
// SEQUENCES (for document numbering: SO-2026-00001)
// ============================================================================

export const sequences = pgTable(
    "sequences",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        code: varchar("code", { length: 50 }).notNull(), // 'sales_order', 'purchase_order', etc.
        prefix: varchar("prefix", { length: 20 }).notNull(), // 'SO', 'PO', etc.
        separator: varchar("separator", { length: 5 }).default("-").notNull(),
        includeYear: boolean("include_year").default(true).notNull(),
        padding: integer("padding").default(5).notNull(),
        nextValue: integer("next_value").default(1).notNull(),
        resetYearly: boolean("reset_yearly").default(true).notNull(),
        currentYear: integer("current_year"),
    },
    (t) => [
        uniqueIndex("sequences_unique_idx").on(t.companyId, t.code),
    ]
);

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        title: varchar("title", { length: 255 }).notNull(),
        body: text("body"),
        type: varchar("type", { length: 50 }).default("info").notNull(), // 'info', 'warning', 'error', 'success'
        module: varchar("module", { length: 50 }),
        resourceType: varchar("resource_type", { length: 50 }),
        resourceId: uuid("resource_id"),
        isRead: boolean("is_read").default(false).notNull(),
        readAt: timestamp("read_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("notifications_user_idx").on(t.userId, t.isRead),
        index("notifications_company_idx").on(t.companyId),
    ]
);

// ============================================================================
// FILE ATTACHMENTS (polymorphic)
// ============================================================================

export const attachments = pgTable(
    "attachments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
        fileName: varchar("file_name", { length: 255 }).notNull(),
        fileUrl: text("file_url").notNull(),
        fileSize: integer("file_size"),
        mimeType: varchar("mime_type", { length: 100 }),
        attachableType: varchar("attachable_type", { length: 50 }).notNull(), // 'sales_order', 'contact', etc.
        attachableId: uuid("attachable_id").notNull(),
        uploadedBy: uuid("uploaded_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("attachments_attachable_idx").on(t.attachableType, t.attachableId),
        index("attachments_company_idx").on(t.companyId),
    ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const companiesRelations = relations(companies, ({ many }) => ({
    userCompanies: many(userCompanies),
    companyModules: many(companyModules),
    roles: many(roles),
    sequences: many(sequences),
}));

export const usersRelations = relations(users, ({ many }) => ({
    userCompanies: many(userCompanies),
    userRoles: many(userRoles),
    sessions: many(sessions),
    accounts: many(accounts),
    notifications: many(notifications),
}));

export const userCompaniesRelations = relations(userCompanies, ({ one }) => ({
    user: one(users, { fields: [userCompanies.userId], references: [users.id] }),
    company: one(companies, { fields: [userCompanies.companyId], references: [companies.id] }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
    company: one(companies, { fields: [roles.companyId], references: [companies.id] }),
    parentRole: one(roles, { fields: [roles.parentRoleId], references: [roles.id] }),
    rolePermissions: many(rolePermissions),
    userRoles: many(userRoles),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
    permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
    user: one(users, { fields: [userRoles.userId], references: [users.id] }),
    role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
    company: one(companies, { fields: [userRoles.companyId], references: [companies.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
    activeCompany: one(companies, { fields: [sessions.activeCompanyId], references: [companies.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const companyModulesRelations = relations(companyModules, ({ one }) => ({
    company: one(companies, { fields: [companyModules.companyId], references: [companies.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, { fields: [notifications.userId], references: [users.id] }),
    company: one(companies, { fields: [notifications.companyId], references: [companies.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
    company: one(companies, { fields: [auditLogs.companyId], references: [companies.id] }),
}));
