"use server";

import { db } from "@/lib/db";
import {
    products,
    productCategories,
    warehouses,
    stockLevels,
    stockMoves,
    unitsOfMeasure,
} from "@/lib/db/schema";
import { eq, and, ilike, or, sql, desc, asc, type SQL } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

// ============================================================================
// PRODUCTS — LIST
// ============================================================================

export interface ProductFilters {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    categoryId?: string;
    isActive?: string;
}

export async function getProductsAction(filters: ProductFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(products.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(products.name, `%${filters.search}%`),
                ilike(products.sku, `%${filters.search}%`),
                ilike(products.barcode, `%${filters.search}%`)
            )!
        );
    }
    if (filters.type && filters.type !== "all") {
        conditions.push(eq(products.type, filters.type as "goods" | "service" | "consumable"));
    }
    if (filters.categoryId) {
        conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters.isActive === "true") conditions.push(eq(products.isActive, true));
    else if (filters.isActive === "false") conditions.push(eq(products.isActive, false));

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
                type: products.type,
                salePrice: products.salePrice,
                costPrice: products.costPrice,
                currentStock: products.currentStock,
                reorderLevel: products.reorderLevel,
                trackInventory: products.trackInventory,
                isActive: products.isActive,
                image: products.image,
                categoryId: products.categoryId,
                createdAt: products.createdAt,
            })
            .from(products)
            .where(where)
            .orderBy(asc(products.name))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(products)
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// PRODUCTS — SINGLE
// ============================================================================

export async function getProductAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.companyId, user.activeCompanyId)))
        .limit(1);

    return product ?? null;
}

// ============================================================================
// PRODUCTS — CREATE
// ============================================================================

export async function createProductAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Product name is required" };

    const type = (formData.get("type") as string) || "goods";

    const [created] = await db
        .insert(products)
        .values({
            companyId: user.activeCompanyId,
            name: name.trim(),
            sku: (formData.get("sku") as string)?.trim() || null,
            barcode: (formData.get("barcode") as string)?.trim() || null,
            internalRef: (formData.get("internalRef") as string)?.trim() || null,
            description: (formData.get("description") as string)?.trim() || null,
            type: type as "goods" | "service" | "consumable",
            categoryId: (formData.get("categoryId") as string) || null,
            uomId: (formData.get("uomId") as string) || null,
            salePrice: (formData.get("salePrice") as string) || "0",
            costPrice: (formData.get("costPrice") as string) || "0",
            taxRate: (formData.get("taxRate") as string) || "0",
            trackInventory: formData.get("trackInventory") !== "false",
            reorderLevel: (formData.get("reorderLevel") as string) || "0",
            reorderQty: (formData.get("reorderQty") as string) || "0",
            weight: (formData.get("weight") as string) || null,
            weightUnit: (formData.get("weightUnit") as string)?.trim() || null,
            isSellable: formData.get("isSellable") !== "false",
            isPurchasable: formData.get("isPurchasable") !== "false",
            createdBy: user.id,
        })
        .returning();

    revalidatePath("/inventory/products");
    return { success: true, productId: created.id };
}

// ============================================================================
// PRODUCTS — UPDATE
// ============================================================================

export async function updateProductAction(id: string, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Product name is required" };

    await db
        .update(products)
        .set({
            name: name.trim(),
            sku: (formData.get("sku") as string)?.trim() || null,
            barcode: (formData.get("barcode") as string)?.trim() || null,
            internalRef: (formData.get("internalRef") as string)?.trim() || null,
            description: (formData.get("description") as string)?.trim() || null,
            type: ((formData.get("type") as string) || "goods") as "goods" | "service" | "consumable",
            categoryId: (formData.get("categoryId") as string) || null,
            uomId: (formData.get("uomId") as string) || null,
            salePrice: (formData.get("salePrice") as string) || "0",
            costPrice: (formData.get("costPrice") as string) || "0",
            taxRate: (formData.get("taxRate") as string) || "0",
            trackInventory: formData.get("trackInventory") !== "false",
            reorderLevel: (formData.get("reorderLevel") as string) || "0",
            reorderQty: (formData.get("reorderQty") as string) || "0",
            weight: (formData.get("weight") as string) || null,
            weightUnit: (formData.get("weightUnit") as string)?.trim() || null,
            isSellable: formData.get("isSellable") !== "false",
            isPurchasable: formData.get("isPurchasable") !== "false",
            isActive: formData.get("isActive") !== "false",
            updatedAt: new Date(),
        })
        .where(and(eq(products.id, id), eq(products.companyId, user.activeCompanyId)));

    revalidatePath("/inventory/products");
    revalidatePath(`/inventory/products/${id}`);
    return { success: true };
}

// ============================================================================
// PRODUCTS — DELETE
// ============================================================================

export async function deleteProductAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db.delete(products).where(
        and(eq(products.id, id), eq(products.companyId, user.activeCompanyId))
    );

    revalidatePath("/inventory/products");
    return { success: true };
}

// ============================================================================
// CATEGORIES — CRUD
// ============================================================================

export async function getCategoriesAction() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return [];

    return db
        .select()
        .from(productCategories)
        .where(eq(productCategories.companyId, user.activeCompanyId))
        .orderBy(asc(productCategories.name));
}

export async function createCategoryAction(prevState: unknown, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Name is required" };

    await db.insert(productCategories).values({
        companyId: user.activeCompanyId,
        name: name.trim(),
        description: (formData.get("description") as string)?.trim() || null,
        parentId: (formData.get("parentId") as string) || null,
    });

    revalidatePath("/inventory/products");
    return { success: true };
}

export async function updateCategoryAction(id: string, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Name is required" };

    await db.update(productCategories).set({
        name: name.trim(),
        description: (formData.get("description") as string)?.trim() || null,
    }).where(and(eq(productCategories.id, id), eq(productCategories.companyId, user.activeCompanyId)));

    revalidatePath("/inventory/categories");
    revalidatePath("/inventory/products");
    return { success: true };
}

export async function deleteCategoryAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    // Check if any products use this category
    const [used] = await db.select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(and(eq(products.categoryId, id), eq(products.companyId, user.activeCompanyId)));

    if (used && used.count > 0) return { error: "Cannot delete category with products assigned" };

    await db.delete(productCategories).where(
        and(eq(productCategories.id, id), eq(productCategories.companyId, user.activeCompanyId))
    );

    revalidatePath("/inventory/categories");
    revalidatePath("/inventory/products");
    return { success: true };
}

// ============================================================================
// WAREHOUSES — CRUD
// ============================================================================

export async function getWarehousesAction() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return [];

    return db
        .select()
        .from(warehouses)
        .where(eq(warehouses.companyId, user.activeCompanyId))
        .orderBy(asc(warehouses.name));
}

export async function createWarehouseAction(prevState: unknown, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    if (!name?.trim() || !code?.trim()) return { error: "Name and code are required" };

    await db.insert(warehouses).values({
        companyId: user.activeCompanyId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: (formData.get("address") as string)?.trim() || null,
        city: (formData.get("city") as string)?.trim() || null,
        country: (formData.get("country") as string)?.trim() || null,
    });

    revalidatePath("/inventory/warehouses");
    return { success: true };
}

export async function updateWarehouseAction(id: string, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    if (!name?.trim() || !code?.trim()) return { error: "Name and code are required" };

    await db.update(warehouses).set({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: (formData.get("address") as string)?.trim() || null,
        city: (formData.get("city") as string)?.trim() || null,
        country: (formData.get("country") as string)?.trim() || null,
    }).where(and(eq(warehouses.id, id), eq(warehouses.companyId, user.activeCompanyId)));

    revalidatePath("/inventory/warehouses");
    return { success: true };
}

export async function deleteWarehouseAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    // Check if any stock levels exist for this warehouse
    const [used] = await db.select({ count: sql<number>`count(*)::int` })
        .from(stockLevels)
        .where(eq(stockLevels.warehouseId, id));

    if (used && used.count > 0) return { error: "Cannot delete warehouse with stock records" };

    await db.delete(warehouses).where(
        and(eq(warehouses.id, id), eq(warehouses.companyId, user.activeCompanyId))
    );

    revalidatePath("/inventory/warehouses");
    return { success: true };
}

// ============================================================================
// STOCK MOVES — Record a stock movement
// ============================================================================

export async function createStockMoveAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const productId = formData.get("productId") as string;
    const warehouseId = formData.get("warehouseId") as string;
    const type = formData.get("type") as string;
    const quantity = formData.get("quantity") as string;

    if (!productId || !warehouseId || !type || !quantity) {
        return { error: "Product, warehouse, type, and quantity are required" };
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return { error: "Quantity must be positive" };

    // Record the move
    await db.insert(stockMoves).values({
        companyId: user.activeCompanyId,
        productId,
        warehouseId,
        type: type as "in" | "out" | "transfer" | "adjustment" | "return",
        quantity: String(qty),
        notes: (formData.get("notes") as string)?.trim() || null,
        reference: (formData.get("reference") as string)?.trim() || null,
        movedBy: user.id,
    });

    // Update stock level
    const [existing] = await db
        .select()
        .from(stockLevels)
        .where(
            and(eq(stockLevels.productId, productId), eq(stockLevels.warehouseId, warehouseId))
        )
        .limit(1);

    const delta = type === "in" || type === "return" ? qty : -qty;

    if (existing) {
        await db
            .update(stockLevels)
            .set({
                quantity: sql`${stockLevels.quantity}::numeric + ${delta}`,
                lastUpdated: new Date(),
            })
            .where(eq(stockLevels.id, existing.id));
    } else {
        await db.insert(stockLevels).values({
            companyId: user.activeCompanyId,
            productId,
            warehouseId,
            quantity: String(Math.max(0, delta)),
        });
    }

    // Update denormalized stock on products
    const totalStock = await db
        .select({ total: sql<string>`COALESCE(SUM(${stockLevels.quantity}::numeric), 0)` })
        .from(stockLevels)
        .where(eq(stockLevels.productId, productId));

    await db
        .update(products)
        .set({ currentStock: totalStock[0]?.total ?? "0", updatedAt: new Date() })
        .where(eq(products.id, productId));

    revalidatePath("/inventory/products");
    revalidatePath(`/inventory/products/${productId}`);
    revalidatePath("/inventory/stock-moves");
    return { success: true };
}

// ============================================================================
// STOCK MOVES — LIST
// ============================================================================

export interface StockMoveFilters {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
}

export async function getStockMovesAction(filters: StockMoveFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(stockMoves.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(products.name, `%${filters.search}%`),
                ilike(products.sku, `%${filters.search}%`),
                ilike(stockMoves.reference, `%${filters.search}%`)
            )!
        );
    }
    if (filters.type && filters.type !== "all") {
        conditions.push(
            eq(stockMoves.type, filters.type as "in" | "out" | "transfer" | "adjustment" | "return")
        );
    }

    const where = and(...conditions);

    const { warehouses: warehousesTable } = await import("@/lib/db/schema");

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: stockMoves.id,
                type: stockMoves.type,
                quantity: stockMoves.quantity,
                reference: stockMoves.reference,
                referenceType: stockMoves.referenceType,
                notes: stockMoves.notes,
                movedAt: stockMoves.movedAt,
                productName: products.name,
                productSku: products.sku,
                productId: stockMoves.productId,
                warehouseName: warehousesTable.name,
                warehouseId: stockMoves.warehouseId,
            })
            .from(stockMoves)
            .innerJoin(products, eq(products.id, stockMoves.productId))
            .innerJoin(warehousesTable, eq(warehousesTable.id, stockMoves.warehouseId))
            .where(where)
            .orderBy(desc(stockMoves.movedAt))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(stockMoves)
            .innerJoin(products, eq(products.id, stockMoves.productId))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}
