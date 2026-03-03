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
    uniqueIndex,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, users } from "./core";
import { contacts } from "./contacts";

// ============================================================================
// ENUMS
// ============================================================================

export const productTypeEnum = pgEnum("product_type", [
    "goods",     // physical products
    "service",   // services
    "consumable", // no stock tracking
]);

export const stockMoveTypeEnum = pgEnum("stock_move_type", [
    "in",        // goods received
    "out",       // goods shipped
    "transfer",  // between warehouses
    "adjustment", // stock adjustment
    "return",    // customer / vendor return
]);

// ============================================================================
// PRODUCT CATEGORIES
// ============================================================================

export const productCategories = pgTable(
    "product_categories",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        parentId: uuid("parent_id"),
        name: varchar("name", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 255 }),
        description: text("description"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("product_categories_company_idx").on(t.companyId),
        index("product_categories_parent_idx").on(t.parentId),
    ]
);

// ============================================================================
// UNITS OF MEASURE
// ============================================================================

export const unitsOfMeasure = pgTable(
    "units_of_measure",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 50 }).notNull(),       // "Kilogram", "Piece", "Meter"
        abbreviation: varchar("abbreviation", { length: 10 }).notNull(), // "kg", "pc", "m"
        category: varchar("category", { length: 50 }),           // "Weight", "Unit", "Length"
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("uom_company_idx").on(t.companyId),
    ]
);

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = pgTable(
    "products",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),

        // Identification
        name: varchar("name", { length: 255 }).notNull(),
        sku: varchar("sku", { length: 100 }),
        barcode: varchar("barcode", { length: 100 }),
        internalRef: varchar("internal_ref", { length: 100 }),
        description: text("description"),

        // Classification
        type: productTypeEnum("type").default("goods").notNull(),
        categoryId: uuid("category_id").references(() => productCategories.id, { onDelete: "set null" }),
        uomId: uuid("uom_id").references(() => unitsOfMeasure.id, { onDelete: "set null" }),

        // Pricing
        salePrice: numeric("sale_price", { precision: 15, scale: 2 }).default("0"),
        costPrice: numeric("cost_price", { precision: 15, scale: 2 }).default("0"),
        currency: varchar("currency", { length: 3 }).default("USD"),
        taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),

        // Stock info (denormalized for quick reads)
        trackInventory: boolean("track_inventory").default(true).notNull(),
        currentStock: numeric("current_stock", { precision: 15, scale: 4 }).default("0"),
        reorderLevel: numeric("reorder_level", { precision: 15, scale: 4 }).default("0"),
        reorderQty: numeric("reorder_qty", { precision: 15, scale: 4 }).default("0"),

        // Physical
        weight: numeric("weight", { precision: 10, scale: 4 }),
        weightUnit: varchar("weight_unit", { length: 10 }),

        // Media
        image: text("image"),
        images: jsonb("images").default([]).$type<string[]>(),

        // Vendor
        defaultVendorId: uuid("default_vendor_id").references(() => contacts.id, { onDelete: "set null" }),

        // Meta
        tags: jsonb("tags").default([]).$type<string[]>(),
        attributes: jsonb("attributes").default({}).$type<Record<string, string>>(),
        isActive: boolean("is_active").default(true).notNull(),
        isSellable: boolean("is_sellable").default(true).notNull(),
        isPurchasable: boolean("is_purchasable").default(true).notNull(),

        createdBy: uuid("created_by").references(() => users.id),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("products_company_idx").on(t.companyId),
        index("products_category_idx").on(t.companyId, t.categoryId),
        index("products_sku_idx").on(t.companyId, t.sku),
        index("products_name_idx").on(t.companyId, t.name),
    ]
);

// ============================================================================
// WAREHOUSES
// ============================================================================

export const warehouses = pgTable(
    "warehouses",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        code: varchar("code", { length: 20 }).notNull(),
        address: varchar("address", { length: 500 }),
        city: varchar("city", { length: 100 }),
        country: varchar("country", { length: 2 }),
        managerId: uuid("manager_id").references(() => users.id, { onDelete: "set null" }),
        isDefault: boolean("is_default").default(false).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("warehouses_company_idx").on(t.companyId),
        uniqueIndex("warehouses_code_idx").on(t.companyId, t.code),
    ]
);

// ============================================================================
// STOCK LEVELS (per product per warehouse)
// ============================================================================

export const stockLevels = pgTable(
    "stock_levels",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        warehouseId: uuid("warehouse_id")
            .notNull()
            .references(() => warehouses.id, { onDelete: "cascade" }),
        quantity: numeric("quantity", { precision: 15, scale: 4 }).default("0").notNull(),
        reservedQty: numeric("reserved_qty", { precision: 15, scale: 4 }).default("0").notNull(),
        lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("stock_levels_unique_idx").on(t.productId, t.warehouseId),
        index("stock_levels_company_idx").on(t.companyId),
        index("stock_levels_product_idx").on(t.productId),
    ]
);

// ============================================================================
// STOCK MOVES (ledger of all stock changes)
// ============================================================================

export const stockMoves = pgTable(
    "stock_moves",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        companyId: uuid("company_id")
            .notNull()
            .references(() => companies.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        warehouseId: uuid("warehouse_id")
            .notNull()
            .references(() => warehouses.id, { onDelete: "cascade" }),
        destinationWarehouseId: uuid("destination_warehouse_id").references(() => warehouses.id),

        type: stockMoveTypeEnum("type").notNull(),
        quantity: numeric("quantity", { precision: 15, scale: 4 }).notNull(),
        reference: varchar("reference", { length: 100 }), // e.g. "SO-0001", "PO-0002"
        referenceType: varchar("reference_type", { length: 50 }), // 'sale_order', 'purchase_order', 'manual'
        referenceId: uuid("reference_id"),
        notes: text("notes"),
        movedBy: uuid("moved_by").references(() => users.id),
        movedAt: timestamp("moved_at", { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (t) => [
        index("stock_moves_company_idx").on(t.companyId),
        index("stock_moves_product_idx").on(t.productId),
        index("stock_moves_warehouse_idx").on(t.warehouseId),
        index("stock_moves_date_idx").on(t.movedAt),
    ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
    company: one(companies, {
        fields: [productCategories.companyId],
        references: [companies.id],
    }),
    parent: one(productCategories, {
        fields: [productCategories.parentId],
        references: [productCategories.id],
        relationName: "categoryParentChild",
    }),
    children: many(productCategories, { relationName: "categoryParentChild" }),
    products: many(products),
}));

export const unitsOfMeasureRelations = relations(unitsOfMeasure, ({ one }) => ({
    company: one(companies, {
        fields: [unitsOfMeasure.companyId],
        references: [companies.id],
    }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    company: one(companies, {
        fields: [products.companyId],
        references: [companies.id],
    }),
    category: one(productCategories, {
        fields: [products.categoryId],
        references: [productCategories.id],
    }),
    uom: one(unitsOfMeasure, {
        fields: [products.uomId],
        references: [unitsOfMeasure.id],
    }),
    defaultVendor: one(contacts, {
        fields: [products.defaultVendorId],
        references: [contacts.id],
    }),
    createdByUser: one(users, {
        fields: [products.createdBy],
        references: [users.id],
    }),
    stockLevels: many(stockLevels),
    stockMoves: many(stockMoves),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
    company: one(companies, {
        fields: [warehouses.companyId],
        references: [companies.id],
    }),
    manager: one(users, {
        fields: [warehouses.managerId],
        references: [users.id],
    }),
    stockLevels: many(stockLevels),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
    company: one(companies, {
        fields: [stockLevels.companyId],
        references: [companies.id],
    }),
    product: one(products, {
        fields: [stockLevels.productId],
        references: [products.id],
    }),
    warehouse: one(warehouses, {
        fields: [stockLevels.warehouseId],
        references: [warehouses.id],
    }),
}));

export const stockMovesRelations = relations(stockMoves, ({ one }) => ({
    company: one(companies, {
        fields: [stockMoves.companyId],
        references: [companies.id],
    }),
    product: one(products, {
        fields: [stockMoves.productId],
        references: [products.id],
    }),
    warehouse: one(warehouses, {
        fields: [stockMoves.warehouseId],
        references: [warehouses.id],
    }),
    destinationWarehouse: one(warehouses, {
        fields: [stockMoves.destinationWarehouseId],
        references: [warehouses.id],
    }),
    movedByUser: one(users, {
        fields: [stockMoves.movedBy],
        references: [users.id],
    }),
}));
