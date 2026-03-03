"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Landmark, DollarSign, ArrowDownLeft, ArrowUpRight, BarChart3 } from "lucide-react";
import { useCallback } from "react";

function fmt(val: number | string | null) {
    const n = typeof val === "number" ? val : parseFloat(val ?? "0");
    return isNaN(n)
        ? "$0.00"
        : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtDate(d: Date | string | null) {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

interface BankAccount {
    id: string;
    code: string;
    name: string;
    balance: string | null;
}

interface Transaction {
    lineId: string;
    entryId: string;
    entryNumber: string;
    date: Date;
    reference: string | null;
    description: string | null;
    lineDescription: string | null;
    debit: string | null;
    credit: string | null;
}

interface Summary {
    totalDebit: number;
    totalCredit: number;
    balance: number;
    transactionCount: number;
}

interface Props {
    bankAccounts: BankAccount[];
    selectedAccount: BankAccount | null;
    transactions: Transaction[];
    summary: Summary | null;
    startDate: string;
    endDate: string;
}

export function BankReconciliationClient({
    bankAccounts,
    selectedAccount,
    transactions,
    summary,
    startDate,
    endDate,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            }
            router.push(`/accounting/bank-reconciliation?${params.toString()}`);
        },
        [router, searchParams]
    );

    if (bankAccounts.length === 0) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold">Bank Reconciliation</h2>
                    <p className="text-sm text-muted-foreground">
                        Reconcile your bank and cash accounts.
                    </p>
                </div>
                <EmptyState
                    icon={Landmark}
                    title="No reconcilable accounts"
                    description="Mark an account as reconcilable in the Chart of Accounts to enable bank reconciliation."
                    action={
                        <Button onClick={() => router.push("/accounting/accounts")}>
                            Go to Chart of Accounts
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold">Bank Reconciliation</h2>
                <p className="text-sm text-muted-foreground">
                    Review posted transactions for reconcilable accounts.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    value={selectedAccount?.id ?? ""}
                    onValueChange={(v) => updateParams({ accountId: v })}
                >
                    <SelectTrigger className="w-70">
                        <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                        {bankAccounts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                                {a.code} — {a.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    className="w-40"
                    value={startDate}
                    onChange={(e) => updateParams({ startDate: e.target.value })}
                    placeholder="Start date"
                />
                <Input
                    type="date"
                    className="w-40"
                    value={endDate}
                    onChange={(e) => updateParams({ endDate: e.target.value })}
                    placeholder="End date"
                />
                {(startDate || endDate) && (
                    <Button variant="ghost" size="sm" onClick={() => updateParams({ startDate: "", endDate: "" })}>
                        Clear dates
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Book Balance</CardTitle>
                            <DollarSign className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{fmt(summary.balance)}</div>
                            <p className="text-xs text-muted-foreground">
                                {selectedAccount?.code} — {selectedAccount?.name}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
                            <ArrowDownLeft className="size-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{fmt(summary.totalDebit)}</div>
                            <p className="text-xs text-muted-foreground">Money in</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                            <ArrowUpRight className="size-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{fmt(summary.totalCredit)}</div>
                            <p className="text-xs text-muted-foreground">Money out</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                            <BarChart3 className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.transactionCount}</div>
                            <p className="text-xs text-muted-foreground">Posted entries</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Transactions Table */}
            {transactions.length === 0 ? (
                <EmptyState
                    icon={Landmark}
                    title="No transactions found"
                    description="No posted journal entries for this account in the selected period."
                />
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Entry #</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((tx) => {
                                const debit = parseFloat(tx.debit ?? "0");
                                const credit = parseFloat(tx.credit ?? "0");
                                return (
                                    <TableRow key={tx.lineId}>
                                        <TableCell>{fmtDate(tx.date)}</TableCell>
                                        <TableCell className="font-medium text-primary">
                                            {tx.entryNumber}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{tx.reference ?? "—"}</TableCell>
                                        <TableCell>{tx.lineDescription || tx.description || "—"}</TableCell>
                                        <TableCell className="text-right">
                                            {debit > 0 ? <span className="text-green-600">{fmt(debit)}</span> : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {credit > 0 ? <span className="text-red-600">{fmt(credit)}</span> : "—"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
