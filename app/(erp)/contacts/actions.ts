"use server";

import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq, and, ilike, or, sql, desc, asc, type SQL } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { PaginationParams } from "@/lib/types";

// ============================================================================
// LIST / SEARCH
// ============================================================================

export interface ContactFilters extends PaginationParams {
    search?: string;
    type?: string;
    isOrganization?: string; // "true" | "false"
    isActive?: string;       // "true" | "false"
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export async function getContactsAction(filters: ContactFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(contacts.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(contacts.name, `%${filters.search}%`),
                ilike(contacts.email, `%${filters.search}%`),
                ilike(contacts.phone, `%${filters.search}%`)
            )!
        );
    }

    if (filters.type && filters.type !== "all") {
        conditions.push(eq(contacts.type, filters.type as "customer" | "vendor" | "customer_vendor" | "employee" | "other"));
    }

    if (filters.isOrganization === "true") {
        conditions.push(eq(contacts.isOrganization, true));
    } else if (filters.isOrganization === "false") {
        conditions.push(eq(contacts.isOrganization, false));
    }

    if (filters.isActive === "true") {
        conditions.push(eq(contacts.isActive, true));
    } else if (filters.isActive === "false") {
        conditions.push(eq(contacts.isActive, false));
    }

    const where = and(...conditions);

    const orderCol = filters.sortBy === "email" ? contacts.email
        : filters.sortBy === "type" ? contacts.type
            : filters.sortBy === "createdAt" ? contacts.createdAt
                : contacts.name;
    const orderFn = filters.sortOrder === "desc" ? desc : asc;

    const [data, countResult] = await Promise.all([
        db
            .select()
            .from(contacts)
            .where(where)
            .orderBy(orderFn(orderCol))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(contacts)
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// GET SINGLE
// ============================================================================

export async function getContactAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const [contact] = await db
        .select()
        .from(contacts)
        .where(
            and(
                eq(contacts.id, id),
                eq(contacts.companyId, user.activeCompanyId)
            )
        )
        .limit(1);

    return contact ?? null;
}

// ============================================================================
// CREATE
// ============================================================================

export async function createContactAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Name is required" };

    const type = (formData.get("type") as string) || "customer";
    const isOrganization = formData.get("isOrganization") === "true";

    const [created] = await db
        .insert(contacts)
        .values({
            companyId: user.activeCompanyId,
            name: name.trim(),
            displayName: (formData.get("displayName") as string)?.trim() || name.trim(),
            type: type as "customer" | "vendor" | "customer_vendor" | "employee" | "other",
            isOrganization,
            email: (formData.get("email") as string)?.trim() || null,
            phone: (formData.get("phone") as string)?.trim() || null,
            mobile: (formData.get("mobile") as string)?.trim() || null,
            website: (formData.get("website") as string)?.trim() || null,
            taxId: (formData.get("taxId") as string)?.trim() || null,
            jobTitle: (formData.get("jobTitle") as string)?.trim() || null,
            department: (formData.get("department") as string)?.trim() || null,
            street: (formData.get("street") as string)?.trim() || null,
            city: (formData.get("city") as string)?.trim() || null,
            state: (formData.get("state") as string)?.trim() || null,
            zip: (formData.get("zip") as string)?.trim() || null,
            country: (formData.get("country") as string)?.trim() || null,
            notes: (formData.get("notes") as string)?.trim() || null,
            parentId: (formData.get("parentId") as string) || null,
            createdBy: user.id,
        })
        .returning();

    revalidatePath("/contacts");
    return { success: true, contactId: created.id };
}

// ============================================================================
// UPDATE
// ============================================================================

export async function updateContactAction(id: string, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = formData.get("name") as string;
    if (!name?.trim()) return { error: "Name is required" };

    const type = (formData.get("type") as string) || "customer";
    const isOrganization = formData.get("isOrganization") === "true";

    await db
        .update(contacts)
        .set({
            name: name.trim(),
            displayName: (formData.get("displayName") as string)?.trim() || name.trim(),
            type: type as "customer" | "vendor" | "customer_vendor" | "employee" | "other",
            isOrganization,
            email: (formData.get("email") as string)?.trim() || null,
            phone: (formData.get("phone") as string)?.trim() || null,
            mobile: (formData.get("mobile") as string)?.trim() || null,
            website: (formData.get("website") as string)?.trim() || null,
            taxId: (formData.get("taxId") as string)?.trim() || null,
            jobTitle: (formData.get("jobTitle") as string)?.trim() || null,
            department: (formData.get("department") as string)?.trim() || null,
            street: (formData.get("street") as string)?.trim() || null,
            city: (formData.get("city") as string)?.trim() || null,
            state: (formData.get("state") as string)?.trim() || null,
            zip: (formData.get("zip") as string)?.trim() || null,
            country: (formData.get("country") as string)?.trim() || null,
            notes: (formData.get("notes") as string)?.trim() || null,
            isActive: formData.get("isActive") !== "false",
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(contacts.id, id),
                eq(contacts.companyId, user.activeCompanyId)
            )
        );

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    return { success: true };
}

// ============================================================================
// DELETE
// ============================================================================

export async function deleteContactAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db
        .delete(contacts)
        .where(
            and(
                eq(contacts.id, id),
                eq(contacts.companyId, user.activeCompanyId)
            )
        );

    revalidatePath("/contacts");
    return { success: true };
}
