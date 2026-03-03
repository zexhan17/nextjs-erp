"use server";

import { db } from "@/lib/db";
import {
    purchaseOrders,
    purchaseOrderLines,
    vendorBills,
    vendorBillLines,
    vendorPayments,
    contacts,
    sequences,
} from "@/lib/db/schema";
import { eq, and, ilike, or, sql, desc, asc, type SQL } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

// ============================================================================
// SEQUENCE HELPER
// ============================================================================

async function getNextSequence(companyId: string, prefix: string): Promise<string> {
    const [seq] = await db
        .select()
        .from(sequences)
        .where(and(eq(sequences.companyId, companyId), eq(sequences.prefix, prefix)))
        .limit(1);

    if (!seq) {
        await db.insert(sequences).values({
            companyId,
            code: prefix,
            prefix,
            nextValue: 1,
            padding: 4,
        });
        return `${prefix}-0001`;
    }

    const nextVal = seq.nextValue + 1;
    await db
        .update(sequences)
        .set({ nextValue: nextVal })
        .where(eq(sequences.id, seq.id));

    return `${prefix}-${String(nextVal).padStart(seq.padding, "0")}`;
}

// ============================================================================
// PURCHASE ORDERS — LIST
// ============================================================================

export interface PurchaseOrderFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

export async function getPurchaseOrdersAction(filters: PurchaseOrderFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(purchaseOrders.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(purchaseOrders.number, `%${filters.search}%`),
                ilike(contacts.name, `%${filters.search}%`)
            )!
        );
    }
    if (filters.status && filters.status !== "all") {
        conditions.push(
            eq(
                purchaseOrders.status,
                filters.status as "draft" | "sent" | "confirmed" | "received" | "partially_received" | "cancelled"
            )
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: purchaseOrders.id,
                number: purchaseOrders.number,
                status: purchaseOrders.status,
                orderDate: purchaseOrders.orderDate,
                expectedDate: purchaseOrders.expectedDate,
                total: purchaseOrders.total,
                amountPaid: purchaseOrders.amountPaid,
                currency: purchaseOrders.currency,
                vendorName: contacts.name,
                vendorId: purchaseOrders.vendorId,
            })
            .from(purchaseOrders)
            .innerJoin(contacts, eq(contacts.id, purchaseOrders.vendorId))
            .where(where)
            .orderBy(desc(purchaseOrders.orderDate))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(purchaseOrders)
            .innerJoin(contacts, eq(contacts.id, purchaseOrders.vendorId))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// PURCHASE ORDERS — SINGLE (with lines)
// ============================================================================

export async function getPurchaseOrderAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const [order] = await db
        .select({
            id: purchaseOrders.id,
            companyId: purchaseOrders.companyId,
            number: purchaseOrders.number,
            vendorId: purchaseOrders.vendorId,
            vendorName: contacts.name,
            vendorEmail: contacts.email,
            status: purchaseOrders.status,
            orderDate: purchaseOrders.orderDate,
            expectedDate: purchaseOrders.expectedDate,
            receivedDate: purchaseOrders.receivedDate,
            shippingAddress: purchaseOrders.shippingAddress,
            subtotal: purchaseOrders.subtotal,
            taxAmount: purchaseOrders.taxAmount,
            discount: purchaseOrders.discount,
            total: purchaseOrders.total,
            amountPaid: purchaseOrders.amountPaid,
            currency: purchaseOrders.currency,
            notes: purchaseOrders.notes,
            terms: purchaseOrders.terms,
            createdAt: purchaseOrders.createdAt,
            updatedAt: purchaseOrders.updatedAt,
        })
        .from(purchaseOrders)
        .innerJoin(contacts, eq(contacts.id, purchaseOrders.vendorId))
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.companyId, user.activeCompanyId)))
        .limit(1);

    if (!order) return null;

    const lines = await db
        .select()
        .from(purchaseOrderLines)
        .where(eq(purchaseOrderLines.purchaseOrderId, id))
        .orderBy(asc(purchaseOrderLines.sortOrder));

    return { ...order, lines };
}

// ============================================================================
// PURCHASE ORDERS — CREATE
// ============================================================================

export async function createPurchaseOrderAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const vendorId = formData.get("vendorId") as string;
    if (!vendorId) return { error: "Vendor is required" };

    const number = await getNextSequence(user.activeCompanyId, "PO");

    const lineCount = parseInt(formData.get("lineCount") as string, 10) || 0;
    const lines: {
        productId: string | null;
        description: string;
        quantity: string;
        unitPrice: string;
        discount: string;
        taxRate: string;
    }[] = [];

    for (let i = 0; i < lineCount; i++) {
        const desc = formData.get(`lines[${i}].description`) as string;
        if (!desc?.trim()) continue;
        lines.push({
            productId: (formData.get(`lines[${i}].productId`) as string) || null,
            description: desc.trim(),
            quantity: (formData.get(`lines[${i}].quantity`) as string) || "1",
            unitPrice: (formData.get(`lines[${i}].unitPrice`) as string) || "0",
            discount: (formData.get(`lines[${i}].discount`) as string) || "0",
            taxRate: (formData.get(`lines[${i}].taxRate`) as string) || "0",
        });
    }

    if (lines.length === 0) return { error: "At least one line item is required" };

    let subtotal = 0;
    let taxAmount = 0;
    const computedLines = lines.map((line, idx) => {
        const qty = parseFloat(line.quantity);
        const price = parseFloat(line.unitPrice);
        const disc = parseFloat(line.discount) / 100;
        const tax = parseFloat(line.taxRate) / 100;
        const lineSubtotal = qty * price * (1 - disc);
        const lineTax = lineSubtotal * tax;
        subtotal += lineSubtotal;
        taxAmount += lineTax;
        return {
            ...line,
            lineTotal: String(lineSubtotal + lineTax),
            sortOrder: idx,
        };
    });

    const total = subtotal + taxAmount;

    const [created] = await db
        .insert(purchaseOrders)
        .values({
            companyId: user.activeCompanyId,
            number,
            vendorId,
            status: "draft",
            orderDate: new Date(),
            expectedDate: (formData.get("expectedDate") as string) ? new Date(formData.get("expectedDate") as string) : null,
            shippingAddress: (formData.get("shippingAddress") as string)?.trim() || null,
            subtotal: String(subtotal),
            taxAmount: String(taxAmount),
            discount: "0",
            total: String(total),
            amountPaid: "0",
            currency: (formData.get("currency") as string) || "USD",
            notes: (formData.get("notes") as string)?.trim() || null,
            terms: (formData.get("terms") as string)?.trim() || null,
            createdBy: user.id,
        })
        .returning();

    if (computedLines.length > 0) {
        await db.insert(purchaseOrderLines).values(
            computedLines.map((line) => ({
                purchaseOrderId: created.id,
                productId: line.productId,
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                discount: line.discount,
                taxRate: line.taxRate,
                lineTotal: line.lineTotal,
                sortOrder: line.sortOrder,
            }))
        );
    }

    revalidatePath("/purchase/orders");
    return { success: true, orderId: created.id };
}

// ============================================================================
// PURCHASE ORDERS — UPDATE STATUS
// ============================================================================

export async function updatePurchaseOrderStatusAction(id: string, status: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const updates: Record<string, unknown> = {
        status: status as "draft" | "sent" | "confirmed" | "received" | "partially_received" | "cancelled",
        updatedAt: new Date(),
    };

    if (status === "received") {
        updates.receivedDate = new Date();
    }

    await db
        .update(purchaseOrders)
        .set(updates)
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.companyId, user.activeCompanyId)));

    revalidatePath("/purchase/orders");
    revalidatePath(`/purchase/orders/${id}`);
    return { success: true };
}

// ============================================================================
// PURCHASE ORDERS — DELETE
// ============================================================================

export async function deletePurchaseOrderAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [order] = await db
        .select({ status: purchaseOrders.status })
        .from(purchaseOrders)
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.companyId, user.activeCompanyId)))
        .limit(1);

    if (!order) return { error: "Order not found" };
    if (order.status !== "draft") return { error: "Only draft orders can be deleted" };

    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
    revalidatePath("/purchase/orders");
    return { success: true };
}

// ============================================================================
// VENDOR CONTACTS (for selects)
// ============================================================================

export async function getVendorsAction() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return [];

    return db
        .select({ id: contacts.id, name: contacts.name, email: contacts.email })
        .from(contacts)
        .where(
            and(
                eq(contacts.companyId, user.activeCompanyId),
                or(eq(contacts.type, "vendor"), eq(contacts.type, "customer_vendor"))
            )
        )
        .orderBy(asc(contacts.name));
}

// ============================================================================
// VENDOR BILLS — LIST
// ============================================================================

export interface VendorBillFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

export async function getVendorBillsAction(filters: VendorBillFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(vendorBills.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(vendorBills.number, `%${filters.search}%`),
                ilike(contacts.name, `%${filters.search}%`),
                ilike(vendorBills.reference, `%${filters.search}%`)
            )!
        );
    }
    if (filters.status && filters.status !== "all") {
        conditions.push(
            eq(vendorBills.status, filters.status as "draft" | "received" | "partially_paid" | "paid" | "overdue" | "cancelled")
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: vendorBills.id,
                number: vendorBills.number,
                status: vendorBills.status,
                billDate: vendorBills.billDate,
                dueDate: vendorBills.dueDate,
                total: vendorBills.total,
                amountPaid: vendorBills.amountPaid,
                currency: vendorBills.currency,
                reference: vendorBills.reference,
                vendorName: contacts.name,
                vendorId: vendorBills.vendorId,
            })
            .from(vendorBills)
            .innerJoin(contacts, eq(contacts.id, vendorBills.vendorId))
            .where(where)
            .orderBy(desc(vendorBills.billDate))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(vendorBills)
            .innerJoin(contacts, eq(contacts.id, vendorBills.vendorId))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// VENDOR BILLS — CREATE
// ============================================================================

export async function createVendorBillAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const vendorId = formData.get("vendorId") as string;
    if (!vendorId) return { error: "Vendor is required" };

    const number = await getNextSequence(user.activeCompanyId, "BILL");

    const lineCount = parseInt(formData.get("lineCount") as string, 10) || 0;
    const lines: {
        productId: string | null;
        description: string;
        quantity: string;
        unitPrice: string;
        taxRate: string;
    }[] = [];

    for (let i = 0; i < lineCount; i++) {
        const desc = formData.get(`lines[${i}].description`) as string;
        if (!desc?.trim()) continue;
        lines.push({
            productId: (formData.get(`lines[${i}].productId`) as string) || null,
            description: desc.trim(),
            quantity: (formData.get(`lines[${i}].quantity`) as string) || "1",
            unitPrice: (formData.get(`lines[${i}].unitPrice`) as string) || "0",
            taxRate: (formData.get(`lines[${i}].taxRate`) as string) || "0",
        });
    }

    if (lines.length === 0) return { error: "At least one line item is required" };

    let subtotal = 0;
    let taxAmount = 0;
    const computedLines = lines.map((line, idx) => {
        const qty = parseFloat(line.quantity);
        const price = parseFloat(line.unitPrice);
        const tax = parseFloat(line.taxRate) / 100;
        const lineSubtotal = qty * price;
        const lineTax = lineSubtotal * tax;
        subtotal += lineSubtotal;
        taxAmount += lineTax;
        return { ...line, lineTotal: String(lineSubtotal + lineTax), sortOrder: idx };
    });

    const total = subtotal + taxAmount;

    const [created] = await db
        .insert(vendorBills)
        .values({
            companyId: user.activeCompanyId,
            number,
            vendorId,
            purchaseOrderId: (formData.get("purchaseOrderId") as string) || null,
            status: "draft",
            billDate: new Date(),
            dueDate: (formData.get("dueDate") as string) ? new Date(formData.get("dueDate") as string) : null,
            subtotal: String(subtotal),
            taxAmount: String(taxAmount),
            total: String(total),
            amountPaid: "0",
            currency: (formData.get("currency") as string) || "USD",
            reference: (formData.get("reference") as string)?.trim() || null,
            notes: (formData.get("notes") as string)?.trim() || null,
            createdBy: user.id,
        })
        .returning();

    if (computedLines.length > 0) {
        await db.insert(vendorBillLines).values(
            computedLines.map((line) => ({
                vendorBillId: created.id,
                productId: line.productId,
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                taxRate: line.taxRate,
                lineTotal: line.lineTotal,
                sortOrder: line.sortOrder,
            }))
        );
    }

    revalidatePath("/purchase/bills");
    return { success: true, billId: created.id };
}

// ============================================================================
// VENDOR BILLS — UPDATE STATUS
// ============================================================================

export async function updateVendorBillStatusAction(id: string, status: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db
        .update(vendorBills)
        .set({
            status: status as "draft" | "received" | "partially_paid" | "paid" | "overdue" | "cancelled",
            updatedAt: new Date(),
        })
        .where(and(eq(vendorBills.id, id), eq(vendorBills.companyId, user.activeCompanyId)));

    revalidatePath("/purchase/bills");
    return { success: true };
}

// ============================================================================
// VENDOR BILLS — DELETE
// ============================================================================

export async function deleteVendorBillAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [bill] = await db
        .select({ status: vendorBills.status })
        .from(vendorBills)
        .where(and(eq(vendorBills.id, id), eq(vendorBills.companyId, user.activeCompanyId)))
        .limit(1);

    if (!bill) return { error: "Bill not found" };
    if (bill.status !== "draft") return { error: "Only draft bills can be deleted" };

    await db.delete(vendorBills).where(eq(vendorBills.id, id));
    revalidatePath("/purchase/bills");
    return { success: true };
}

// ============================================================================
// VENDOR PAYMENTS — LIST
// ============================================================================

export interface VendorPaymentFilters {
    page?: number;
    limit?: number;
    search?: string;
}

export async function getVendorPaymentsAction(filters: VendorPaymentFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(vendorPayments.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(contacts.name, `%${filters.search}%`),
                ilike(vendorPayments.reference, `%${filters.search}%`)
            )!
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: vendorPayments.id,
                amount: vendorPayments.amount,
                currency: vendorPayments.currency,
                method: vendorPayments.method,
                reference: vendorPayments.reference,
                paymentDate: vendorPayments.paymentDate,
                notes: vendorPayments.notes,
                vendorName: contacts.name,
                vendorId: vendorPayments.vendorId,
                vendorBillId: vendorPayments.vendorBillId,
            })
            .from(vendorPayments)
            .innerJoin(contacts, eq(contacts.id, vendorPayments.vendorId))
            .where(where)
            .orderBy(desc(vendorPayments.paymentDate))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(vendorPayments)
            .innerJoin(contacts, eq(contacts.id, vendorPayments.vendorId))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// VENDOR PAYMENTS — CREATE
// ============================================================================

export async function createVendorPaymentAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const vendorId = formData.get("vendorId") as string;
    const amount = formData.get("amount") as string;
    if (!vendorId) return { error: "Vendor is required" };
    if (!amount || parseFloat(amount) <= 0) return { error: "Amount must be greater than zero" };

    const [created] = await db
        .insert(vendorPayments)
        .values({
            companyId: user.activeCompanyId,
            vendorBillId: (formData.get("vendorBillId") as string) || null,
            vendorId,
            amount,
            currency: (formData.get("currency") as string) || "USD",
            paymentDate: (formData.get("paymentDate") as string) ? new Date(formData.get("paymentDate") as string) : new Date(),
            method: (formData.get("method") as string) || "bank_transfer",
            reference: (formData.get("reference") as string)?.trim() || null,
            notes: (formData.get("notes") as string)?.trim() || null,
            createdBy: user.id,
        })
        .returning();

    // If linked to a bill, update amountPaid
    const billId = formData.get("vendorBillId") as string;
    if (billId) {
        const paidAmount = parseFloat(amount);
        await db
            .update(vendorBills)
            .set({
                amountPaid: sql`COALESCE(${vendorBills.amountPaid}, 0) + ${paidAmount}`,
                updatedAt: new Date(),
            })
            .where(eq(vendorBills.id, billId));
    }

    revalidatePath("/purchase/payments");
    revalidatePath("/purchase/bills");
    return { success: true, paymentId: created.id };
}

// ============================================================================
// VENDOR PAYMENTS — DELETE
// ============================================================================

export async function deleteVendorPaymentAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [payment] = await db
        .select({ id: vendorPayments.id, amount: vendorPayments.amount, vendorBillId: vendorPayments.vendorBillId })
        .from(vendorPayments)
        .where(and(eq(vendorPayments.id, id), eq(vendorPayments.companyId, user.activeCompanyId)))
        .limit(1);

    if (!payment) return { error: "Payment not found" };

    // Reverse amount on linked bill
    if (payment.vendorBillId) {
        const paidAmount = parseFloat(payment.amount);
        await db
            .update(vendorBills)
            .set({
                amountPaid: sql`GREATEST(COALESCE(${vendorBills.amountPaid}, 0) - ${paidAmount}, 0)`,
                updatedAt: new Date(),
            })
            .where(eq(vendorBills.id, payment.vendorBillId));
    }

    await db.delete(vendorPayments).where(eq(vendorPayments.id, id));
    revalidatePath("/purchase/payments");
    revalidatePath("/purchase/bills");
    return { success: true };
}
