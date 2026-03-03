"use server";

import { db } from "@/lib/db";
import {
    chartOfAccounts,
    journalEntries,
    journalEntryLines,
    taxRates,
    fiscalYears,
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
// CHART OF ACCOUNTS — LIST
// ============================================================================

export async function getAccountsAction(filters?: { search?: string; type?: string }) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return [];

    const conditions: SQL[] = [eq(chartOfAccounts.companyId, user.activeCompanyId)];

    if (filters?.search) {
        conditions.push(
            or(
                ilike(chartOfAccounts.name, `%${filters.search}%`),
                ilike(chartOfAccounts.code, `%${filters.search}%`)
            )!
        );
    }
    if (filters?.type && filters.type !== "all") {
        conditions.push(
            eq(chartOfAccounts.type, filters.type as "asset" | "liability" | "equity" | "revenue" | "expense")
        );
    }

    return db
        .select()
        .from(chartOfAccounts)
        .where(and(...conditions))
        .orderBy(asc(chartOfAccounts.code));
}

// ============================================================================
// CHART OF ACCOUNTS — CREATE
// ============================================================================

export async function createAccountAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const code = (formData.get("code") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const type = formData.get("type") as string;

    if (!code || !name || !type) return { error: "Code, name, and type are required" };

    // Check unique code
    const [existing] = await db
        .select({ id: chartOfAccounts.id })
        .from(chartOfAccounts)
        .where(and(eq(chartOfAccounts.companyId, user.activeCompanyId), eq(chartOfAccounts.code, code)))
        .limit(1);

    if (existing) return { error: "Account code already exists" };

    await db.insert(chartOfAccounts).values({
        companyId: user.activeCompanyId,
        code,
        name,
        type: type as "asset" | "liability" | "equity" | "revenue" | "expense",
        description: (formData.get("description") as string)?.trim() || null,
        parentId: (formData.get("parentId") as string) || null,
        isReconcilable: formData.get("isReconcilable") === "on",
    });

    revalidatePath("/accounting/accounts");
    return { success: true };
}

// ============================================================================
// CHART OF ACCOUNTS — DELETE
// ============================================================================

export async function deleteAccountAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    // Check for journal lines referencing this account
    const [used] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(journalEntryLines)
        .where(eq(journalEntryLines.accountId, id));

    if (used && used.count > 0) return { error: "Cannot delete account with journal entries" };

    await db.delete(chartOfAccounts).where(
        and(eq(chartOfAccounts.id, id), eq(chartOfAccounts.companyId, user.activeCompanyId))
    );

    revalidatePath("/accounting/accounts");
    return { success: true };
}

// ============================================================================
// CHART OF ACCOUNTS — UPDATE
// ============================================================================

export async function updateAccountAction(id: string, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const code = (formData.get("code") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const type = formData.get("type") as string;

    if (!code || !name || !type) return { error: "Code, name, and type are required" };

    // Check unique code (exclude current)
    const [existing] = await db
        .select({ id: chartOfAccounts.id })
        .from(chartOfAccounts)
        .where(
            and(
                eq(chartOfAccounts.companyId, user.activeCompanyId),
                eq(chartOfAccounts.code, code),
            )
        )
        .limit(1);

    if (existing && existing.id !== id) return { error: "Account code already exists" };

    await db.update(chartOfAccounts).set({
        code,
        name,
        type: type as "asset" | "liability" | "equity" | "revenue" | "expense",
        description: (formData.get("description") as string)?.trim() || null,
        updatedAt: new Date(),
    }).where(and(eq(chartOfAccounts.id, id), eq(chartOfAccounts.companyId, user.activeCompanyId)));

    revalidatePath("/accounting/accounts");
    return { success: true };
}

// ============================================================================
// JOURNAL ENTRIES — LIST
// ============================================================================

export interface JournalQueryFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

export async function getJournalEntriesAction(filters: JournalQueryFilters) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(journalEntries.companyId, user.activeCompanyId)];

    if (filters.search) {
        conditions.push(
            or(
                ilike(journalEntries.number, `%${filters.search}%`),
                ilike(journalEntries.description ?? "", `%${filters.search}%`)
            )!
        );
    }
    if (filters.status && filters.status !== "all") {
        conditions.push(
            eq(
                journalEntries.status,
                filters.status as "draft" | "posted" | "cancelled"
            )
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db.select()
            .from(journalEntries)
            .where(where)
            .orderBy(desc(journalEntries.date))
            .limit(limit)
            .offset(offset),
        db.select({ count: sql<number>`count(*)::int` })
            .from(journalEntries)
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// JOURNAL ENTRIES — SINGLE (with lines)
// ============================================================================

export async function getJournalEntryAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const [entry] = await db
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, user.activeCompanyId)))
        .limit(1);

    if (!entry) return null;

    const lines = await db
        .select({
            id: journalEntryLines.id,
            accountId: journalEntryLines.accountId,
            accountCode: chartOfAccounts.code,
            accountName: chartOfAccounts.name,
            description: journalEntryLines.description,
            debit: journalEntryLines.debit,
            credit: journalEntryLines.credit,
            sortOrder: journalEntryLines.sortOrder,
        })
        .from(journalEntryLines)
        .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalEntryLines.accountId))
        .where(eq(journalEntryLines.journalEntryId, id))
        .orderBy(asc(journalEntryLines.sortOrder));

    return { ...entry, lines };
}

// ============================================================================
// JOURNAL ENTRIES — CREATE
// ============================================================================

export async function createJournalEntryAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const number = await getNextSequence(user.activeCompanyId, "JE");

    const lineCount = parseInt(formData.get("lineCount") as string, 10) || 0;
    const lines: {
        accountId: string;
        description: string;
        debit: string;
        credit: string;
    }[] = [];

    for (let i = 0; i < lineCount; i++) {
        const accountId = formData.get(`lines[${i}].accountId`) as string;
        if (!accountId) continue;
        lines.push({
            accountId,
            description: (formData.get(`lines[${i}].description`) as string)?.trim() || "",
            debit: (formData.get(`lines[${i}].debit`) as string) || "0",
            credit: (formData.get(`lines[${i}].credit`) as string) || "0",
        });
    }

    if (lines.length < 2) return { error: "Journal entry requires at least 2 lines" };

    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
        totalDebit += parseFloat(line.debit);
        totalCredit += parseFloat(line.credit);
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { error: `Entry is unbalanced: Debit ${totalDebit.toFixed(2)} ≠ Credit ${totalCredit.toFixed(2)}` };
    }

    const dateStr = formData.get("date") as string;

    const [created] = await db
        .insert(journalEntries)
        .values({
            companyId: user.activeCompanyId,
            number,
            date: dateStr ? new Date(dateStr) : new Date(),
            status: "draft",
            reference: (formData.get("reference") as string)?.trim() || null,
            description: (formData.get("description") as string)?.trim() || null,
            totalDebit: String(totalDebit),
            totalCredit: String(totalCredit),
            createdBy: user.id,
        })
        .returning();

    await db.insert(journalEntryLines).values(
        lines.map((line, idx) => ({
            journalEntryId: created.id,
            accountId: line.accountId,
            description: line.description || null,
            debit: line.debit,
            credit: line.credit,
            sortOrder: idx,
        }))
    );

    revalidatePath("/accounting/journal");
    return { success: true, entryId: created.id };
}

// ============================================================================
// JOURNAL ENTRIES — POST / CANCEL
// ============================================================================

export async function postJournalEntryAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [entry] = await db.select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, user.activeCompanyId)))
        .limit(1);

    if (!entry) return { error: "Entry not found" };
    if (entry.status !== "draft") return { error: "Only draft entries can be posted" };

    // Update account balances
    const lines = await db.select()
        .from(journalEntryLines)
        .where(eq(journalEntryLines.journalEntryId, id));

    for (const line of lines) {
        const delta = parseFloat(line.debit ?? "0") - parseFloat(line.credit ?? "0");
        await db.update(chartOfAccounts)
            .set({
                balance: sql`${chartOfAccounts.balance}::numeric + ${delta}`,
                updatedAt: new Date(),
            })
            .where(eq(chartOfAccounts.id, line.accountId));
    }

    await db.update(journalEntries)
        .set({ status: "posted", updatedAt: new Date() })
        .where(eq(journalEntries.id, id));

    revalidatePath("/accounting/journal");
    revalidatePath(`/accounting/journal/${id}`);
    return { success: true };
}

export async function cancelJournalEntryAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [entry] = await db.select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, user.activeCompanyId)))
        .limit(1);

    if (!entry) return { error: "Entry not found" };
    if (entry.status !== "draft") return { error: "Only draft entries can be cancelled" };

    await db.update(journalEntries)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(journalEntries.id, id));

    revalidatePath("/accounting/journal");
    revalidatePath(`/accounting/journal/${id}`);
    return { success: true };
}

// ============================================================================
// TAX RATES
// ============================================================================

export async function getTaxRatesAction() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return [];

    return db.select()
        .from(taxRates)
        .where(eq(taxRates.companyId, user.activeCompanyId))
        .orderBy(asc(taxRates.name));
}

export async function createTaxRateAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = (formData.get("name") as string)?.trim();
    const rate = formData.get("rate") as string;

    if (!name || !rate) return { error: "Name and rate are required" };

    await db.insert(taxRates).values({
        companyId: user.activeCompanyId,
        name,
        rate,
        description: (formData.get("description") as string)?.trim() || null,
    });

    revalidatePath("/accounting/taxes");
    return { success: true };
}

export async function deleteTaxRateAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db.delete(taxRates).where(
        and(eq(taxRates.id, id), eq(taxRates.companyId, user.activeCompanyId))
    );

    revalidatePath("/accounting/taxes");
    return { success: true };
}

// ============================================================================
// TAX RATES — UPDATE
// ============================================================================

export async function updateTaxRateAction(id: string, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = (formData.get("name") as string)?.trim();
    const rate = formData.get("rate") as string;

    if (!name || !rate) return { error: "Name and rate are required" };

    await db.update(taxRates).set({
        name,
        rate,
        description: (formData.get("description") as string)?.trim() || null,
    }).where(and(eq(taxRates.id, id), eq(taxRates.companyId, user.activeCompanyId)));

    revalidatePath("/accounting/taxes");
    return { success: true };
}

// ============================================================================
// FISCAL YEARS
// ============================================================================

export async function getFiscalYearsAction() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return [];

    return db.select()
        .from(fiscalYears)
        .where(eq(fiscalYears.companyId, user.activeCompanyId))
        .orderBy(desc(fiscalYears.startDate));
}

export async function createFiscalYearAction(formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const name = (formData.get("name") as string)?.trim();
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (!name || !startDate || !endDate) return { error: "Name and dates are required" };

    await db.insert(fiscalYears).values({
        companyId: user.activeCompanyId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
    });

    revalidatePath("/accounting/fiscal-years");
    return { success: true };
}

// ============================================================================
// FISCAL YEARS — DELETE
// ============================================================================

export async function deleteFiscalYearAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db.delete(fiscalYears).where(
        and(eq(fiscalYears.id, id), eq(fiscalYears.companyId, user.activeCompanyId))
    );

    revalidatePath("/accounting/fiscal-years");
    return { success: true };
}

// ============================================================================
// FISCAL YEARS — CLOSE / REOPEN
// ============================================================================

export async function toggleFiscalYearClosedAction(id: string, close: boolean) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    await db.update(fiscalYears).set({
        isClosed: close,
    }).where(and(eq(fiscalYears.id, id), eq(fiscalYears.companyId, user.activeCompanyId)));

    revalidatePath("/accounting/fiscal-years");
    return { success: true };
}

// ============================================================================
// JOURNAL ENTRIES — DELETE (draft only)
// ============================================================================

export async function deleteJournalEntryAction(id: string) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [entry] = await db.select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, user.activeCompanyId)))
        .limit(1);

    if (!entry) return { error: "Entry not found" };
    if (entry.status !== "draft") return { error: "Only draft entries can be deleted" };

    await db.delete(journalEntryLines).where(eq(journalEntryLines.journalEntryId, id));
    await db.delete(journalEntries).where(eq(journalEntries.id, id));

    revalidatePath("/accounting/journal");
    return { success: true };
}
