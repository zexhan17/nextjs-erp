"use server";

import { db } from "@/lib/db";
import {
    salesOrders,
    salesOrderLines,
    contacts,
    quotations,
    quotationLines,
    invoices,
    invoiceLines,
    payments,
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
        // Create sequence on first use
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
// SALES ORDERS — LIST
// ============================================================================

export interface SalesOrderFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

export async function getSalesOrdersAction(filters: SalesOrderFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(salesOrders.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(salesOrders.number, `%${filters.search}%`),
                ilike(contacts.name, `%${filters.search}%`)
            )!
        );
    }
    if (filters.status && filters.status !== "all") {
        conditions.push(
            eq(
                salesOrders.status,
                filters.status as "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
            )
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: salesOrders.id,
                number: salesOrders.number,
                status: salesOrders.status,
                orderDate: salesOrders.orderDate,
                total: salesOrders.total,
                amountPaid: salesOrders.amountPaid,
                currency: salesOrders.currency,
                customerName: contacts.name,
                customerId: salesOrders.customerId,
            })
            .from(salesOrders)
            .innerJoin(contacts, eq(contacts.id, salesOrders.customerId))
            .where(where)
            .orderBy(desc(salesOrders.orderDate))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(salesOrders)
            .innerJoin(contacts, eq(contacts.id, salesOrders.customerId))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// SALES ORDERS — SINGLE (with lines)
// ============================================================================

export async function getSalesOrderAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const [order] = await db
        .select({
            id: salesOrders.id,
            companyId: salesOrders.companyId,
            number: salesOrders.number,
            customerId: salesOrders.customerId,
            customerName: contacts.name,
            customerEmail: contacts.email,
            status: salesOrders.status,
            orderDate: salesOrders.orderDate,
            deliveryDate: salesOrders.deliveryDate,
            shippingAddress: salesOrders.shippingAddress,
            subtotal: salesOrders.subtotal,
            taxAmount: salesOrders.taxAmount,
            discount: salesOrders.discount,
            total: salesOrders.total,
            amountPaid: salesOrders.amountPaid,
            currency: salesOrders.currency,
            notes: salesOrders.notes,
            terms: salesOrders.terms,
            createdAt: salesOrders.createdAt,
            updatedAt: salesOrders.updatedAt,
        })
        .from(salesOrders)
        .innerJoin(contacts, eq(contacts.id, salesOrders.customerId))
        .where(and(eq(salesOrders.id, id), eq(salesOrders.companyId, user.activeCompanyId)))
        .limit(1);

    if (!order) return null;

    const lines = await db
        .select()
        .from(salesOrderLines)
        .where(eq(salesOrderLines.salesOrderId, id))
        .orderBy(asc(salesOrderLines.sortOrder));

    return { ...order, lines };
}

// ============================================================================
// SALES ORDERS — CREATE
// ============================================================================

export async function createSalesOrderAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const customerId = formData.get("customerId") as string;
    if (!customerId) return { error: "Customer is required" };

    const number = await getNextSequence(user.activeCompanyId, "SO");

    // Parse lines from form data
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

    // Calculate totals
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
        .insert(salesOrders)
        .values({
            companyId: user.activeCompanyId,
            number,
            customerId,
            status: "draft",
            orderDate: new Date(),
            deliveryDate: (formData.get("deliveryDate") as string) ? new Date(formData.get("deliveryDate") as string) : null,
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

    // Insert lines
    if (computedLines.length > 0) {
        await db.insert(salesOrderLines).values(
            computedLines.map((line) => ({
                salesOrderId: created.id,
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

    revalidatePath("/sales/orders");
    return { success: true, orderId: created.id };
}

// ============================================================================
// SALES ORDERS — UPDATE STATUS
// ============================================================================

export async function updateSalesOrderStatusAction(id: string, status: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db
        .update(salesOrders)
        .set({
            status: status as "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled",
            updatedAt: new Date(),
        })
        .where(and(eq(salesOrders.id, id), eq(salesOrders.companyId, user.activeCompanyId)));

    revalidatePath("/sales/orders");
    revalidatePath(`/sales/orders/${id}`);
    return { success: true };
}

// ============================================================================
// SALES ORDERS — DELETE
// ============================================================================

export async function deleteSalesOrderAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    // Only delete draft orders
    const [order] = await db
        .select({ status: salesOrders.status })
        .from(salesOrders)
        .where(and(eq(salesOrders.id, id), eq(salesOrders.companyId, user.activeCompanyId)))
        .limit(1);

    if (!order) return { error: "Order not found" };
    if (order.status !== "draft") return { error: "Only draft orders can be deleted" };

    await db.delete(salesOrders).where(eq(salesOrders.id, id));
    revalidatePath("/sales/orders");
    return { success: true };
}

// ============================================================================
// CUSTOMER CONTACTS (for selects)
// ============================================================================

export async function getCustomersAction() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return [];

    return db
        .select({ id: contacts.id, name: contacts.name, email: contacts.email })
        .from(contacts)
        .where(
            and(
                eq(contacts.companyId, user.activeCompanyId),
                or(eq(contacts.type, "customer"), eq(contacts.type, "customer_vendor"))
            )
        )
        .orderBy(asc(contacts.name));
}

// ============================================================================
// QUOTATIONS — LIST
// ============================================================================

export interface QuotationFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

export async function getQuotationsAction(filters: QuotationFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(quotations.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(quotations.number, `%${filters.search}%`),
                ilike(contacts.name, `%${filters.search}%`)
            )!
        );
    }
    if (filters.status && filters.status !== "all") {
        conditions.push(
            eq(quotations.status, filters.status as "draft" | "sent" | "accepted" | "rejected" | "expired")
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: quotations.id,
                number: quotations.number,
                status: quotations.status,
                date: quotations.date,
                validUntil: quotations.validUntil,
                total: quotations.total,
                currency: quotations.currency,
                customerName: contacts.name,
                customerId: quotations.customerId,
            })
            .from(quotations)
            .innerJoin(contacts, eq(contacts.id, quotations.customerId))
            .where(where)
            .orderBy(desc(quotations.date))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(quotations)
            .innerJoin(contacts, eq(contacts.id, quotations.customerId))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// QUOTATIONS — CREATE
// ============================================================================

export async function createQuotationAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const customerId = formData.get("customerId") as string;
    if (!customerId) return { error: "Customer is required" };

    const number = await getNextSequence(user.activeCompanyId, "QT");

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
        return { ...line, lineTotal: String(lineSubtotal + lineTax), sortOrder: idx };
    });

    const total = subtotal + taxAmount;

    const [created] = await db
        .insert(quotations)
        .values({
            companyId: user.activeCompanyId,
            number,
            customerId,
            status: "draft",
            date: new Date(),
            validUntil: (formData.get("validUntil") as string) ? new Date(formData.get("validUntil") as string) : null,
            subtotal: String(subtotal),
            taxAmount: String(taxAmount),
            discount: "0",
            total: String(total),
            currency: (formData.get("currency") as string) || "USD",
            notes: (formData.get("notes") as string)?.trim() || null,
            terms: (formData.get("terms") as string)?.trim() || null,
            createdBy: user.id,
        })
        .returning();

    if (computedLines.length > 0) {
        await db.insert(quotationLines).values(
            computedLines.map((line) => ({
                quotationId: created.id,
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

    revalidatePath("/sales/quotations");
    return { success: true, quotationId: created.id };
}

// ============================================================================
// QUOTATIONS — UPDATE STATUS
// ============================================================================

export async function updateQuotationStatusAction(id: string, status: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db
        .update(quotations)
        .set({
            status: status as "draft" | "sent" | "accepted" | "rejected" | "expired",
            updatedAt: new Date(),
        })
        .where(and(eq(quotations.id, id), eq(quotations.companyId, user.activeCompanyId)));

    revalidatePath("/sales/quotations");
    return { success: true };
}

// ============================================================================
// QUOTATIONS — DELETE
// ============================================================================

export async function deleteQuotationAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [qt] = await db
        .select({ status: quotations.status })
        .from(quotations)
        .where(and(eq(quotations.id, id), eq(quotations.companyId, user.activeCompanyId)))
        .limit(1);

    if (!qt) return { error: "Quotation not found" };
    if (qt.status !== "draft") return { error: "Only draft quotations can be deleted" };

    await db.delete(quotations).where(eq(quotations.id, id));
    revalidatePath("/sales/quotations");
    return { success: true };
}

// ============================================================================
// INVOICES — LIST
// ============================================================================

export interface InvoiceFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

export async function getInvoicesAction(filters: InvoiceFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(invoices.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(invoices.number, `%${filters.search}%`),
                ilike(contacts.name, `%${filters.search}%`)
            )!
        );
    }
    if (filters.status && filters.status !== "all") {
        conditions.push(
            eq(invoices.status, filters.status as "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled" | "refunded")
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: invoices.id,
                number: invoices.number,
                status: invoices.status,
                issueDate: invoices.issueDate,
                dueDate: invoices.dueDate,
                total: invoices.total,
                amountPaid: invoices.amountPaid,
                balanceDue: invoices.balanceDue,
                currency: invoices.currency,
                customerName: contacts.name,
                customerId: invoices.customerId,
            })
            .from(invoices)
            .innerJoin(contacts, eq(contacts.id, invoices.customerId))
            .where(where)
            .orderBy(desc(invoices.issueDate))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(invoices)
            .innerJoin(contacts, eq(contacts.id, invoices.customerId))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// INVOICES — CREATE
// ============================================================================

export async function createInvoiceAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const customerId = formData.get("customerId") as string;
    if (!customerId) return { error: "Customer is required" };

    const number = await getNextSequence(user.activeCompanyId, "INV");

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
        return { ...line, lineTotal: String(lineSubtotal + lineTax), sortOrder: idx };
    });

    const total = subtotal + taxAmount;

    const [created] = await db
        .insert(invoices)
        .values({
            companyId: user.activeCompanyId,
            number,
            customerId,
            salesOrderId: (formData.get("salesOrderId") as string) || null,
            status: "draft",
            issueDate: new Date(),
            dueDate: (formData.get("dueDate") as string) ? new Date(formData.get("dueDate") as string) : null,
            subtotal: String(subtotal),
            taxAmount: String(taxAmount),
            discount: "0",
            total: String(total),
            amountPaid: "0",
            balanceDue: String(total),
            currency: (formData.get("currency") as string) || "USD",
            notes: (formData.get("notes") as string)?.trim() || null,
            terms: (formData.get("terms") as string)?.trim() || null,
            createdBy: user.id,
        })
        .returning();

    if (computedLines.length > 0) {
        await db.insert(invoiceLines).values(
            computedLines.map((line) => ({
                invoiceId: created.id,
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

    revalidatePath("/sales/invoices");
    return { success: true, invoiceId: created.id };
}

// ============================================================================
// INVOICES — UPDATE STATUS
// ============================================================================

export async function updateInvoiceStatusAction(id: string, status: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db
        .update(invoices)
        .set({
            status: status as "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled" | "refunded",
            updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, id), eq(invoices.companyId, user.activeCompanyId)));

    revalidatePath("/sales/invoices");
    return { success: true };
}

// ============================================================================
// INVOICES — DELETE
// ============================================================================

export async function deleteInvoiceAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [inv] = await db
        .select({ status: invoices.status })
        .from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.companyId, user.activeCompanyId)))
        .limit(1);

    if (!inv) return { error: "Invoice not found" };
    if (inv.status !== "draft") return { error: "Only draft invoices can be deleted" };

    await db.delete(invoices).where(eq(invoices.id, id));
    revalidatePath("/sales/invoices");
    return { success: true };
}

// ============================================================================
// PAYMENTS — LIST
// ============================================================================

export interface PaymentFilters {
    page?: number;
    limit?: number;
    search?: string;
    method?: string;
}

export async function getPaymentsAction(filters: PaymentFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(payments.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(payments.number, `%${filters.search}%`),
                ilike(contacts.name, `%${filters.search}%`),
                ilike(payments.reference, `%${filters.search}%`)
            )!
        );
    }
    if (filters.method && filters.method !== "all") {
        conditions.push(
            eq(payments.method, filters.method as "cash" | "bank_transfer" | "credit_card" | "check" | "online" | "other")
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db
            .select({
                id: payments.id,
                number: payments.number,
                amount: payments.amount,
                currency: payments.currency,
                method: payments.method,
                reference: payments.reference,
                paidAt: payments.paidAt,
                customerName: contacts.name,
                customerId: payments.customerId,
                invoiceId: payments.invoiceId,
            })
            .from(payments)
            .leftJoin(contacts, eq(contacts.id, payments.customerId))
            .where(where)
            .orderBy(desc(payments.paidAt))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(payments)
            .leftJoin(contacts, eq(contacts.id, payments.customerId))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// PAYMENTS — CREATE
// ============================================================================

export async function createPaymentAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const amount = formData.get("amount") as string;
    if (!amount || parseFloat(amount) <= 0) return { error: "Amount must be greater than zero" };

    const number = await getNextSequence(user.activeCompanyId, "PAY");

    const [created] = await db
        .insert(payments)
        .values({
            companyId: user.activeCompanyId,
            number,
            invoiceId: (formData.get("invoiceId") as string) || null,
            customerId: (formData.get("customerId") as string) || null,
            amount,
            currency: (formData.get("currency") as string) || "USD",
            method: (formData.get("method") as "cash" | "bank_transfer" | "credit_card" | "check" | "online" | "other") || "cash",
            reference: (formData.get("reference") as string)?.trim() || null,
            notes: (formData.get("notes") as string)?.trim() || null,
            paidAt: (formData.get("paidAt") as string) ? new Date(formData.get("paidAt") as string) : new Date(),
            createdBy: user.id,
        })
        .returning();

    // If linked to an invoice, update amountPaid and balanceDue
    const invoiceId = formData.get("invoiceId") as string;
    if (invoiceId) {
        const paidAmount = parseFloat(amount);
        await db
            .update(invoices)
            .set({
                amountPaid: sql`${invoices.amountPaid} + ${paidAmount}`,
                balanceDue: sql`${invoices.balanceDue} - ${paidAmount}`,
                updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoiceId));
    }

    revalidatePath("/sales/payments");
    revalidatePath("/sales/invoices");
    return { success: true, paymentId: created.id };
}

// ============================================================================
// PAYMENTS — DELETE
// ============================================================================

export async function deletePaymentAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [payment] = await db
        .select({ id: payments.id, amount: payments.amount, invoiceId: payments.invoiceId })
        .from(payments)
        .where(and(eq(payments.id, id), eq(payments.companyId, user.activeCompanyId)))
        .limit(1);

    if (!payment) return { error: "Payment not found" };

    // Reverse amount on linked invoice
    if (payment.invoiceId) {
        const paidAmount = parseFloat(payment.amount);
        await db
            .update(invoices)
            .set({
                amountPaid: sql`${invoices.amountPaid} - ${paidAmount}`,
                balanceDue: sql`${invoices.balanceDue} + ${paidAmount}`,
                updatedAt: new Date(),
            })
            .where(eq(invoices.id, payment.invoiceId));
    }

    await db.delete(payments).where(eq(payments.id, id));
    revalidatePath("/sales/payments");
    revalidatePath("/sales/invoices");
    return { success: true };
}
