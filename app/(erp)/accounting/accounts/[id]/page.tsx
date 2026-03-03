import { notFound } from "next/navigation";
import Link from "next/link";
import { getAccountLedgerAction } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AccountLedgerFilters } from "./account-ledger-filters";

const typeColors: Record<string, string> = {
    asset: "bg-blue-100 text-blue-800",
    liability: "bg-red-100 text-red-800",
    equity: "bg-purple-100 text-purple-800",
    revenue: "bg-green-100 text-green-800",
    expense: "bg-amber-100 text-amber-800",
};

function fmt(val: string | null | number) {
    const n = typeof val === "number" ? val : parseFloat(val ?? "0");
    return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default async function AccountLedgerPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const { id } = await params;
    const sp = await searchParams;
    const page = parseInt(sp.page ?? "1", 10);
    const startDate = sp.startDate ?? "";
    const endDate = sp.endDate ?? "";

    const result = await getAccountLedgerAction(id, {
        page,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    if (!result) notFound();

    const { account, lines, total, totalDebit, totalCredit } = result;
    const limit = 50;
    const totalPages = Math.ceil(total / limit);
    const netBalance = totalDebit - totalCredit;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/accounting/accounts">
                    <Button variant="ghost" size="icon" className="size-8">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">
                            <span className="font-mono mr-2">{account.code}</span>
                            {account.name}
                        </h1>
                        <Badge className={typeColors[account.type] ?? ""}>
                            {account.type}
                        </Badge>
                    </div>
                    {account.description && (
                        <p className="text-sm text-muted-foreground mt-1">{account.description}</p>
                    )}
                </div>
            </div>

            {/* Balance Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Debits</p>
                        <p className="text-2xl font-bold">{fmt(totalDebit)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Credits</p>
                        <p className="text-2xl font-bold">{fmt(totalCredit)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Net Balance</p>
                        <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {fmt(netBalance)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Transactions</p>
                        <p className="text-2xl font-bold">{total}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <AccountLedgerFilters
                accountId={id}
                startDate={startDate}
                endDate={endDate}
            />

            {/* Transaction List */}
            <Card>
                <CardHeader>
                    <CardTitle>Ledger Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {lines.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No posted transactions found for this account.
                        </p>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Entry</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.map((line) => (
                                        <TableRow key={line.lineId}>
                                            <TableCell>
                                                {new Date(line.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/accounting/journal/${line.entryId}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {line.entryNumber}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {line.reference || "—"}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-muted-foreground">
                                                {line.lineDescription || line.entryDescription || "—"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {parseFloat(line.debit ?? "0") > 0 ? fmt(line.debit) : "—"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {parseFloat(line.credit ?? "0") > 0 ? fmt(line.credit) : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">{total} transactions</p>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/accounting/accounts/${id}?page=${Math.max(1, page - 1)}${startDate ? `&startDate=${startDate}` : ""}${endDate ? `&endDate=${endDate}` : ""}`}
                                        >
                                            <Button variant="outline" size="icon" className="size-8" disabled={page <= 1}>
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                        </Link>
                                        <span className="text-sm">{page} / {totalPages}</span>
                                        <Link
                                            href={`/accounting/accounts/${id}?page=${Math.min(totalPages, page + 1)}${startDate ? `&startDate=${startDate}` : ""}${endDate ? `&endDate=${endDate}` : ""}`}
                                        >
                                            <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages}>
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
