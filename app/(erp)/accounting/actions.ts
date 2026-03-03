"use server";

import { db } from "@/lib/db";
import {
    chartOfAccounts,
    journalEntries,
    journalEntryLines,
    taxRates,
    fiscalYears,
    sequences,
    invoices,
    payments,
    vendorBills,
    vendorPayments,
    contacts,
} from "@/lib/db/schema";
import { eq, and, ilike, or, sql, desc, asc, gte, lte, type SQL } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

// ============================================================================
// JOURNAL ENTRIES — UPDATE (draft only)
// ============================================================================

export async function updateJournalEntryAction(id: string, formData: FormData) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { error: "No active company" };

    const [entry] = await db.select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, id), eq(journalEntries.companyId, user.activeCompanyId)))
        .limit(1);

    if (!entry) return { error: "Entry not found" };
    if (entry.status !== "draft") return { error: "Only draft entries can be edited" };

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

    await db.update(journalEntries).set({
        date: dateStr ? new Date(dateStr) : entry.date,
        reference: (formData.get("reference") as string)?.trim() || null,
        description: (formData.get("description") as string)?.trim() || null,
        totalDebit: String(totalDebit),
        totalCredit: String(totalCredit),
        updatedAt: new Date(),
    }).where(eq(journalEntries.id, id));

    // Replace all lines
    await db.delete(journalEntryLines).where(eq(journalEntryLines.journalEntryId, id));
    await db.insert(journalEntryLines).values(
        lines.map((line, idx) => ({
            journalEntryId: id,
            accountId: line.accountId,
            description: line.description || null,
            debit: line.debit,
            credit: line.credit,
            sortOrder: idx,
        }))
    );

    revalidatePath("/accounting/journal");
    revalidatePath(`/accounting/journal/${id}`);
    return { success: true };
}

// ============================================================================
// ACCOUNTING DASHBOARD — STATS
// ============================================================================

export async function getAccountingDashboardAction() {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const companyId = user.activeCompanyId;

    const [accountStats, journalStats, recentEntries] = await Promise.all([
        // Account balances by type
        db.select({
            type: chartOfAccounts.type,
            totalBalance: sql<string>`sum(${chartOfAccounts.balance}::numeric)`,
            count: sql<number>`count(*)::int`,
        })
            .from(chartOfAccounts)
            .where(and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.isActive, true)))
            .groupBy(chartOfAccounts.type),

        // Journal entry stats
        db.select({
            status: journalEntries.status,
            count: sql<number>`count(*)::int`,
            totalDebit: sql<string>`coalesce(sum(${journalEntries.totalDebit}::numeric), 0)`,
        })
            .from(journalEntries)
            .where(eq(journalEntries.companyId, companyId))
            .groupBy(journalEntries.status),

        // Recent journal entries
        db.select()
            .from(journalEntries)
            .where(eq(journalEntries.companyId, companyId))
            .orderBy(desc(journalEntries.createdAt))
            .limit(5),
    ]);

    // Compute totals
    const balanceByType: Record<string, { balance: number; count: number }> = {};
    for (const row of accountStats) {
        balanceByType[row.type] = {
            balance: parseFloat(row.totalBalance ?? "0"),
            count: row.count,
        };
    }

    const journalByStatus: Record<string, { count: number; total: number }> = {};
    let totalJournalEntries = 0;
    for (const row of journalStats) {
        journalByStatus[row.status] = {
            count: row.count,
            total: parseFloat(row.totalDebit ?? "0"),
        };
        totalJournalEntries += row.count;
    }

    const totalAssets = balanceByType.asset?.balance ?? 0;
    const totalLiabilities = balanceByType.liability?.balance ?? 0;
    const totalEquity = balanceByType.equity?.balance ?? 0;
    const totalRevenue = Math.abs(balanceByType.revenue?.balance ?? 0);
    const totalExpenses = Math.abs(balanceByType.expense?.balance ?? 0);
    const netIncome = totalRevenue - totalExpenses;
    const totalAccounts = Object.values(balanceByType).reduce((s, v) => s + v.count, 0);

    return {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalRevenue,
        totalExpenses,
        netIncome,
        totalAccounts,
        totalJournalEntries,
        draftEntries: journalByStatus.draft?.count ?? 0,
        postedEntries: journalByStatus.posted?.count ?? 0,
        cancelledEntries: journalByStatus.cancelled?.count ?? 0,
        recentEntries,
        balanceByType,
    };
}

// ============================================================================
// ACCOUNT LEDGER — transactions for a single account
// ============================================================================

export async function getAccountLedgerAction(
    accountId: string,
    filters?: { startDate?: string; endDate?: string; page?: number; limit?: number }
) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    // Get the account
    const [account] = await db
        .select()
        .from(chartOfAccounts)
        .where(and(eq(chartOfAccounts.id, accountId), eq(chartOfAccounts.companyId, user.activeCompanyId)))
        .limit(1);

    if (!account) return null;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [
        eq(journalEntryLines.accountId, accountId),
        eq(journalEntries.status, "posted"),
    ];

    if (filters?.startDate) {
        conditions.push(gte(journalEntries.date, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
        conditions.push(lte(journalEntries.date, new Date(filters.endDate)));
    }

    const where = and(...conditions);

    const [lines, countResult] = await Promise.all([
        db.select({
            lineId: journalEntryLines.id,
            entryId: journalEntries.id,
            entryNumber: journalEntries.number,
            date: journalEntries.date,
            reference: journalEntries.reference,
            entryDescription: journalEntries.description,
            lineDescription: journalEntryLines.description,
            debit: journalEntryLines.debit,
            credit: journalEntryLines.credit,
        })
            .from(journalEntryLines)
            .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
            .where(where)
            .orderBy(desc(journalEntries.date), asc(journalEntryLines.sortOrder))
            .limit(limit)
            .offset(offset),
        db.select({ count: sql<number>`count(*)::int` })
            .from(journalEntryLines)
            .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
            .where(where),
    ]);

    // Compute running balance
    const totalResult = await db.select({
        totalDebit: sql<string>`coalesce(sum(${journalEntryLines.debit}::numeric), 0)`,
        totalCredit: sql<string>`coalesce(sum(${journalEntryLines.credit}::numeric), 0)`,
    })
        .from(journalEntryLines)
        .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
        .where(and(eq(journalEntryLines.accountId, accountId), eq(journalEntries.status, "posted")));

    return {
        account,
        lines,
        total: countResult[0]?.count ?? 0,
        totalDebit: parseFloat(totalResult[0]?.totalDebit ?? "0"),
        totalCredit: parseFloat(totalResult[0]?.totalCredit ?? "0"),
    };
}

// ============================================================================
// REPORTS — TRIAL BALANCE
// ============================================================================

export async function getTrialBalanceAction(filters?: { date?: string; fiscalYearId?: string }) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const companyId = user.activeCompanyId;

    // Get date constraints
    const dateConditions: SQL[] = [eq(journalEntries.status, "posted")];
    if (filters?.date) {
        dateConditions.push(lte(journalEntries.date, new Date(filters.date)));
    }
    if (filters?.fiscalYearId) {
        const [fy] = await db.select().from(fiscalYears)
            .where(and(eq(fiscalYears.id, filters.fiscalYearId), eq(fiscalYears.companyId, companyId)))
            .limit(1);
        if (fy) {
            dateConditions.push(gte(journalEntries.date, fy.startDate));
            dateConditions.push(lte(journalEntries.date, fy.endDate));
        }
    }

    const accounts = await db.select({
        id: chartOfAccounts.id,
        code: chartOfAccounts.code,
        name: chartOfAccounts.name,
        type: chartOfAccounts.type,
        totalDebit: sql<string>`coalesce(sum(${journalEntryLines.debit}::numeric), 0)`,
        totalCredit: sql<string>`coalesce(sum(${journalEntryLines.credit}::numeric), 0)`,
    })
        .from(chartOfAccounts)
        .leftJoin(journalEntryLines, eq(journalEntryLines.accountId, chartOfAccounts.id))
        .leftJoin(journalEntries, and(
            eq(journalEntries.id, journalEntryLines.journalEntryId),
            ...dateConditions,
        ))
        .where(and(eq(chartOfAccounts.companyId, companyId), eq(chartOfAccounts.isActive, true)))
        .groupBy(chartOfAccounts.id, chartOfAccounts.code, chartOfAccounts.name, chartOfAccounts.type)
        .orderBy(asc(chartOfAccounts.code));

    // Calculate balances per account type convention:
    // Assets and Expenses have normal debit balances
    // Liabilities, Equity, and Revenue have normal credit balances
    const rows = accounts.map((a) => {
        const debit = parseFloat(a.totalDebit ?? "0");
        const credit = parseFloat(a.totalCredit ?? "0");
        const netDebit = debit - credit;
        const isDebitNormal = a.type === "asset" || a.type === "expense";

        return {
            ...a,
            debit,
            credit,
            balance: isDebitNormal ? netDebit : -netDebit,
            debitBalance: netDebit > 0 ? netDebit : 0,
            creditBalance: netDebit < 0 ? -netDebit : 0,
        };
    }).filter((a) => a.debit !== 0 || a.credit !== 0);

    const totalDebits = rows.reduce((s, r) => s + r.debitBalance, 0);
    const totalCredits = rows.reduce((s, r) => s + r.creditBalance, 0);

    return { rows, totalDebits, totalCredits };
}

// ============================================================================
// REPORTS — BALANCE SHEET
// ============================================================================

export async function getBalanceSheetAction(filters?: { date?: string }) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const companyId = user.activeCompanyId;

    const dateConditions: SQL[] = [eq(journalEntries.status, "posted")];
    if (filters?.date) {
        dateConditions.push(lte(journalEntries.date, new Date(filters.date)));
    }

    const accounts = await db.select({
        id: chartOfAccounts.id,
        code: chartOfAccounts.code,
        name: chartOfAccounts.name,
        type: chartOfAccounts.type,
        totalDebit: sql<string>`coalesce(sum(${journalEntryLines.debit}::numeric), 0)`,
        totalCredit: sql<string>`coalesce(sum(${journalEntryLines.credit}::numeric), 0)`,
    })
        .from(chartOfAccounts)
        .leftJoin(journalEntryLines, eq(journalEntryLines.accountId, chartOfAccounts.id))
        .leftJoin(journalEntries, and(
            eq(journalEntries.id, journalEntryLines.journalEntryId),
            ...dateConditions,
        ))
        .where(and(
            eq(chartOfAccounts.companyId, companyId),
            eq(chartOfAccounts.isActive, true),
            or(
                eq(chartOfAccounts.type, "asset"),
                eq(chartOfAccounts.type, "liability"),
                eq(chartOfAccounts.type, "equity"),
            ),
        ))
        .groupBy(chartOfAccounts.id, chartOfAccounts.code, chartOfAccounts.name, chartOfAccounts.type)
        .orderBy(asc(chartOfAccounts.type), asc(chartOfAccounts.code));

    // Also get net income (revenue - expenses) for retained earnings
    const incomeResult = await db.select({
        type: chartOfAccounts.type,
        totalDebit: sql<string>`coalesce(sum(${journalEntryLines.debit}::numeric), 0)`,
        totalCredit: sql<string>`coalesce(sum(${journalEntryLines.credit}::numeric), 0)`,
    })
        .from(chartOfAccounts)
        .leftJoin(journalEntryLines, eq(journalEntryLines.accountId, chartOfAccounts.id))
        .leftJoin(journalEntries, and(
            eq(journalEntries.id, journalEntryLines.journalEntryId),
            ...dateConditions,
        ))
        .where(and(
            eq(chartOfAccounts.companyId, companyId),
            eq(chartOfAccounts.isActive, true),
            or(eq(chartOfAccounts.type, "revenue"), eq(chartOfAccounts.type, "expense")),
        ))
        .groupBy(chartOfAccounts.type);

    let totalRevenueNet = 0;
    let totalExpenseNet = 0;
    for (const row of incomeResult) {
        const net = parseFloat(row.totalCredit ?? "0") - parseFloat(row.totalDebit ?? "0");
        if (row.type === "revenue") totalRevenueNet = net;
        if (row.type === "expense") totalExpenseNet = -net;
    }
    const retainedEarnings = totalRevenueNet - totalExpenseNet;

    const assets: { code: string; name: string; balance: number }[] = [];
    const liabilities: { code: string; name: string; balance: number }[] = [];
    const equity: { code: string; name: string; balance: number }[] = [];

    for (const a of accounts) {
        const debit = parseFloat(a.totalDebit ?? "0");
        const credit = parseFloat(a.totalCredit ?? "0");
        const row = { code: a.code, name: a.name, balance: 0 };

        if (a.type === "asset") {
            row.balance = debit - credit;
            assets.push(row);
        } else if (a.type === "liability") {
            row.balance = credit - debit;
            liabilities.push(row);
        } else if (a.type === "equity") {
            row.balance = credit - debit;
            equity.push(row);
        }
    }

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0) + retainedEarnings;

    return {
        assets,
        liabilities,
        equity,
        retainedEarnings,
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
}

// ============================================================================
// REPORTS — INCOME STATEMENT (Profit & Loss)
// ============================================================================

export async function getIncomeStatementAction(filters?: {
    startDate?: string;
    endDate?: string;
    fiscalYearId?: string;
}) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const companyId = user.activeCompanyId;

    const dateConditions: SQL[] = [eq(journalEntries.status, "posted")];

    if (filters?.fiscalYearId) {
        const [fy] = await db.select().from(fiscalYears)
            .where(and(eq(fiscalYears.id, filters.fiscalYearId), eq(fiscalYears.companyId, companyId)))
            .limit(1);
        if (fy) {
            dateConditions.push(gte(journalEntries.date, fy.startDate));
            dateConditions.push(lte(journalEntries.date, fy.endDate));
        }
    } else {
        if (filters?.startDate) {
            dateConditions.push(gte(journalEntries.date, new Date(filters.startDate)));
        }
        if (filters?.endDate) {
            dateConditions.push(lte(journalEntries.date, new Date(filters.endDate)));
        }
    }

    const accounts = await db.select({
        id: chartOfAccounts.id,
        code: chartOfAccounts.code,
        name: chartOfAccounts.name,
        type: chartOfAccounts.type,
        totalDebit: sql<string>`coalesce(sum(${journalEntryLines.debit}::numeric), 0)`,
        totalCredit: sql<string>`coalesce(sum(${journalEntryLines.credit}::numeric), 0)`,
    })
        .from(chartOfAccounts)
        .leftJoin(journalEntryLines, eq(journalEntryLines.accountId, chartOfAccounts.id))
        .leftJoin(journalEntries, and(
            eq(journalEntries.id, journalEntryLines.journalEntryId),
            ...dateConditions,
        ))
        .where(and(
            eq(chartOfAccounts.companyId, companyId),
            eq(chartOfAccounts.isActive, true),
            or(eq(chartOfAccounts.type, "revenue"), eq(chartOfAccounts.type, "expense")),
        ))
        .groupBy(chartOfAccounts.id, chartOfAccounts.code, chartOfAccounts.name, chartOfAccounts.type)
        .orderBy(asc(chartOfAccounts.type), asc(chartOfAccounts.code));

    const revenue: { code: string; name: string; amount: number }[] = [];
    const expenses: { code: string; name: string; amount: number }[] = [];

    for (const a of accounts) {
        const debit = parseFloat(a.totalDebit ?? "0");
        const credit = parseFloat(a.totalCredit ?? "0");

        if (a.type === "revenue") {
            const amount = credit - debit;
            if (amount !== 0) revenue.push({ code: a.code, name: a.name, amount });
        } else if (a.type === "expense") {
            const amount = debit - credit;
            if (amount !== 0) expenses.push({ code: a.code, name: a.name, amount });
        }
    }

    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return { revenue, expenses, totalRevenue, totalExpenses, netIncome };
}

// ============================================================================
// REPORTS — GENERAL LEDGER
// ============================================================================

export async function getGeneralLedgerAction(filters?: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
}) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const companyId = user.activeCompanyId;

    const conditions: SQL[] = [
        eq(chartOfAccounts.companyId, companyId),
        eq(journalEntries.status, "posted"),
    ];

    if (filters?.startDate) {
        conditions.push(gte(journalEntries.date, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
        conditions.push(lte(journalEntries.date, new Date(filters.endDate)));
    }
    if (filters?.accountId) {
        conditions.push(eq(chartOfAccounts.id, filters.accountId));
    }

    const lines = await db.select({
        accountId: chartOfAccounts.id,
        accountCode: chartOfAccounts.code,
        accountName: chartOfAccounts.name,
        accountType: chartOfAccounts.type,
        entryId: journalEntries.id,
        entryNumber: journalEntries.number,
        date: journalEntries.date,
        reference: journalEntries.reference,
        entryDescription: journalEntries.description,
        lineDescription: journalEntryLines.description,
        debit: journalEntryLines.debit,
        credit: journalEntryLines.credit,
    })
        .from(journalEntryLines)
        .innerJoin(chartOfAccounts, eq(chartOfAccounts.id, journalEntryLines.accountId))
        .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
        .where(and(...conditions))
        .orderBy(asc(chartOfAccounts.code), asc(journalEntries.date))
        .limit(1000);

    // Group by account
    const grouped: Record<string, {
        accountId: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        lines: typeof lines;
        totalDebit: number;
        totalCredit: number;
        balance: number;
    }> = {};

    for (const line of lines) {
        if (!grouped[line.accountId]) {
            grouped[line.accountId] = {
                accountId: line.accountId,
                accountCode: line.accountCode,
                accountName: line.accountName,
                accountType: line.accountType,
                lines: [],
                totalDebit: 0,
                totalCredit: 0,
                balance: 0,
            };
        }
        grouped[line.accountId].lines.push(line);
        grouped[line.accountId].totalDebit += parseFloat(line.debit ?? "0");
        grouped[line.accountId].totalCredit += parseFloat(line.credit ?? "0");
    }

    // Calculate balance per type
    const accountGroups = Object.values(grouped)
        .map((g) => {
            const isDebitNormal = g.accountType === "asset" || g.accountType === "expense";
            g.balance = isDebitNormal
                ? g.totalDebit - g.totalCredit
                : g.totalCredit - g.totalDebit;
            return g;
        })
        .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return { accounts: accountGroups };
}

// ============================================================================
// ACCOUNTING — INVOICES LIST (all customer invoices for accounting view)
// ============================================================================

export async function getAccountingInvoicesAction(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(invoices.companyId, user.activeCompanyId)];

    if (filters?.search) {
        conditions.push(
            or(
                ilike(invoices.number, `%${filters.search}%`),
                ilike(contacts.name, `%${filters.search}%`)
            )!
        );
    }
    if (filters?.status && filters.status !== "all") {
        conditions.push(
            eq(invoices.status, filters.status as "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled" | "refunded")
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db.select({
            id: invoices.id,
            number: invoices.number,
            customerName: contacts.name,
            customerId: invoices.customerId,
            status: invoices.status,
            issueDate: invoices.issueDate,
            dueDate: invoices.dueDate,
            total: invoices.total,
            amountPaid: invoices.amountPaid,
            balanceDue: invoices.balanceDue,
            currency: invoices.currency,
        })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .where(where)
            .orderBy(desc(invoices.issueDate))
            .limit(limit)
            .offset(offset),
        db.select({ count: sql<number>`count(*)::int` })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.customerId, contacts.id))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// ACCOUNTING — VENDOR BILLS LIST
// ============================================================================

export async function getAccountingBillsAction(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { data: [], total: 0 };

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 25;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(vendorBills.companyId, user.activeCompanyId)];

    if (filters?.search) {
        conditions.push(
            or(
                ilike(vendorBills.number, `%${filters.search}%`),
                ilike(contacts.name, `%${filters.search}%`)
            )!
        );
    }
    if (filters?.status && filters.status !== "all") {
        conditions.push(
            eq(vendorBills.status, filters.status as "draft" | "received" | "partially_paid" | "paid" | "overdue" | "cancelled")
        );
    }

    const where = and(...conditions);

    const [data, countResult] = await Promise.all([
        db.select({
            id: vendorBills.id,
            number: vendorBills.number,
            vendorName: contacts.name,
            vendorId: vendorBills.vendorId,
            status: vendorBills.status,
            billDate: vendorBills.billDate,
            dueDate: vendorBills.dueDate,
            total: vendorBills.total,
            amountPaid: vendorBills.amountPaid,
            currency: vendorBills.currency,
            reference: vendorBills.reference,
        })
            .from(vendorBills)
            .leftJoin(contacts, eq(vendorBills.vendorId, contacts.id))
            .where(where)
            .orderBy(desc(vendorBills.billDate))
            .limit(limit)
            .offset(offset),
        db.select({ count: sql<number>`count(*)::int` })
            .from(vendorBills)
            .leftJoin(contacts, eq(vendorBills.vendorId, contacts.id))
            .where(where),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
}

// ============================================================================
// ACCOUNTING — PAYMENTS LIST (combined: customer payments + vendor payments)
// ============================================================================

export async function getAccountingPaymentsAction(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string; // "incoming" | "outgoing" | "all"
}) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return { incoming: [], outgoing: [] };

    const companyId = user.activeCompanyId;
    const filterType = filters?.type ?? "all";

    const incoming = filterType === "outgoing" ? [] : await db.select({
        id: payments.id,
        number: payments.number,
        contactName: contacts.name,
        amount: payments.amount,
        currency: payments.currency,
        method: payments.method,
        reference: payments.reference,
        date: payments.paidAt,
        invoiceNumber: invoices.number,
    })
        .from(payments)
        .leftJoin(contacts, eq(payments.customerId, contacts.id))
        .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
        .where(
            filters?.search
                ? and(
                    eq(payments.companyId, companyId),
                    or(ilike(payments.number, `%${filters.search}%`), ilike(contacts.name, `%${filters.search}%`))!
                )
                : eq(payments.companyId, companyId)
        )
        .orderBy(desc(payments.paidAt))
        .limit(50);

    const outgoing = filterType === "incoming" ? [] : await db.select({
        id: vendorPayments.id,
        contactName: contacts.name,
        amount: vendorPayments.amount,
        currency: vendorPayments.currency,
        method: vendorPayments.method,
        reference: vendorPayments.reference,
        date: vendorPayments.paymentDate,
        billNumber: vendorBills.number,
    })
        .from(vendorPayments)
        .leftJoin(contacts, eq(vendorPayments.vendorId, contacts.id))
        .leftJoin(vendorBills, eq(vendorPayments.vendorBillId, vendorBills.id))
        .where(
            filters?.search
                ? and(
                    eq(vendorPayments.companyId, companyId),
                    or(ilike(vendorPayments.reference ?? "", `%${filters.search}%`), ilike(contacts.name, `%${filters.search}%`))!
                )
                : eq(vendorPayments.companyId, companyId)
        )
        .orderBy(desc(vendorPayments.paymentDate))
        .limit(50);

    return { incoming, outgoing };
}

// ============================================================================
// ACCOUNTING — BANK RECONCILIATION DATA
// ============================================================================

export async function getBankReconciliationAction(filters?: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
}) {
    const user = await getSessionUser();
    if (!user.activeCompanyId) return null;

    const companyId = user.activeCompanyId;

    // Get bank/cash accounts (reconcilable accounts)
    const bankAccounts = await db
        .select()
        .from(chartOfAccounts)
        .where(
            and(
                eq(chartOfAccounts.companyId, companyId),
                eq(chartOfAccounts.isActive, true),
                eq(chartOfAccounts.isReconcilable, true)
            )
        )
        .orderBy(asc(chartOfAccounts.code));

    if (bankAccounts.length === 0) {
        return { bankAccounts: [], selectedAccount: null, transactions: [], summary: null };
    }

    const selectedAccountId = filters?.accountId || bankAccounts[0].id;

    const conditions: SQL[] = [
        eq(journalEntryLines.accountId, selectedAccountId),
        eq(journalEntries.status, "posted"),
    ];

    if (filters?.startDate) {
        conditions.push(gte(journalEntries.date, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
        conditions.push(lte(journalEntries.date, new Date(filters.endDate)));
    }

    const transactions = await db
        .select({
            lineId: journalEntryLines.id,
            entryId: journalEntries.id,
            entryNumber: journalEntries.number,
            date: journalEntries.date,
            reference: journalEntries.reference,
            description: journalEntries.description,
            lineDescription: journalEntryLines.description,
            debit: journalEntryLines.debit,
            credit: journalEntryLines.credit,
        })
        .from(journalEntryLines)
        .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
        .where(and(...conditions))
        .orderBy(desc(journalEntries.date))
        .limit(200);

    // Summary
    const [totals] = await db
        .select({
            totalDebit: sql<string>`coalesce(sum(${journalEntryLines.debit}::numeric), 0)`,
            totalCredit: sql<string>`coalesce(sum(${journalEntryLines.credit}::numeric), 0)`,
            count: sql<number>`count(*)::int`,
        })
        .from(journalEntryLines)
        .innerJoin(journalEntries, eq(journalEntries.id, journalEntryLines.journalEntryId))
        .where(and(...conditions));

    const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId) || bankAccounts[0];

    return {
        bankAccounts,
        selectedAccount,
        transactions,
        summary: {
            totalDebit: parseFloat(totals?.totalDebit ?? "0"),
            totalCredit: parseFloat(totals?.totalCredit ?? "0"),
            balance: parseFloat(selectedAccount.balance ?? "0"),
            transactionCount: totals?.count ?? 0,
        },
    };
}