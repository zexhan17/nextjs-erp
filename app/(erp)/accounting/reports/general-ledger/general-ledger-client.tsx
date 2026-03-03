"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Filter, Printer, ChevronDown } from "lucide-react";

const typeColors: Record<string, string> = {
    asset: "bg-blue-100 text-blue-800",
    liability: "bg-red-100 text-red-800",
    equity: "bg-purple-100 text-purple-800",
    revenue: "bg-green-100 text-green-800",
    expense: "bg-amber-100 text-amber-800",
};

function fmt(val: number | string | null) {
    const n = typeof val === "number" ? val : parseFloat(val ?? "0");
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface AccountGroup {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    lines: {
        entryId: string;
        entryNumber: string;
        date: Date;
        reference: string | null;
        entryDescription: string | null;
        lineDescription: string | null;
        debit: string | null;
        credit: string | null;
    }[];
    totalDebit: number;
    totalCredit: number;
    balance: number;
}

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

export function GeneralLedgerClient({
    data,
    accounts,
    currentStartDate,
    currentEndDate,
    currentAccountId,
}: {
    data: { accounts: AccountGroup[] } | null;
    accounts: Account[];
    currentStartDate?: string;
    currentEndDate?: string;
    currentAccountId?: string;
}) {
    const router = useRouter();

    function handleFilter(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const sp = new URLSearchParams();
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        const accountId = formData.get("accountId") as string;
        if (startDate) sp.set("startDate", startDate);
        if (endDate) sp.set("endDate", endDate);
        if (accountId && accountId !== "all") sp.set("accountId", accountId);
        router.push(`/accounting/reports/general-ledger?${sp.toString()}`);
    }

    function handleClear() {
        router.push("/accounting/reports/general-ledger");
    }

    function handlePrint() {
        window.print();
    }

    if (!data) {
        return <p className="text-muted-foreground text-center py-8">No active company.</p>;
    }

    const grandTotalDebit = data.accounts.reduce((s, a) => s + a.totalDebit, 0);
    const grandTotalCredit = data.accounts.reduce((s, a) => s + a.totalCredit, 0);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card className="print:hidden">
                <CardContent className="pt-6">
                    <form onSubmit={handleFilter} className="flex flex-col gap-3 sm:flex-row sm:items-end flex-wrap">
                        <div className="space-y-1">
                            <Label htmlFor="startDate" className="text-xs">From Date</Label>
                            <Input
                                id="startDate"
                                name="startDate"
                                type="date"
                                defaultValue={currentStartDate ?? ""}
                                className="w-40"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="endDate" className="text-xs">To Date</Label>
                            <Input
                                id="endDate"
                                name="endDate"
                                type="date"
                                defaultValue={currentEndDate ?? ""}
                                className="w-40"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Account</Label>
                            <Select name="accountId" defaultValue={currentAccountId ?? "all"}>
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="All accounts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Accounts</SelectItem>
                                    {accounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.code} — {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                            <Filter className="mr-2 size-4" />
                            Apply
                        </Button>
                        {(currentStartDate || currentEndDate || currentAccountId) && (
                            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                                Clear
                            </Button>
                        )}
                        <div className="sm:ml-auto">
                            <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="mr-2 size-4" />
                                Print
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-2xl font-bold">General Ledger</h1>
                <p className="text-sm">
                    {currentStartDate && currentEndDate
                        ? `${new Date(currentStartDate).toLocaleDateString()} — ${new Date(currentEndDate).toLocaleDateString()}`
                        : "All Time"}
                </p>
            </div>

            {/* Grand Totals */}
            <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary">{data.accounts.length} accounts</Badge>
                <span className="text-muted-foreground">
                    Total: Dr {fmt(grandTotalDebit)} / Cr {fmt(grandTotalCredit)}
                </span>
            </div>

            {/* Account Groups */}
            {data.accounts.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No posted transactions found for the selected criteria.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {data.accounts.map((group) => (
                        <Collapsible key={group.accountId} defaultOpen>
                            <Card>
                                <CollapsibleTrigger className="w-full">
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <ChevronDown className="size-4 text-muted-foreground transition-transform" />
                                                <span className="font-mono text-sm">{group.accountCode}</span>
                                                <CardTitle className="text-base">{group.accountName}</CardTitle>
                                                <Badge variant="secondary" className={`text-xs ${typeColors[group.accountType] ?? ""}`}>
                                                    {group.accountType}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-muted-foreground">
                                                    Balance: <span className="font-bold text-foreground">{fmt(group.balance)}</span>
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {group.lines.length} entries
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="pt-0">
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
                                                {group.lines.map((line, idx) => (
                                                    <TableRow key={`${line.entryId}-${idx}`}>
                                                        <TableCell className="text-sm">
                                                            {new Date(line.date).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link
                                                                href={`/accounting/journal/${line.entryId}`}
                                                                className="font-medium hover:underline text-sm"
                                                            >
                                                                {line.entryNumber}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {line.reference || "—"}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                                                            {line.lineDescription || line.entryDescription || "—"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-sm">
                                                            {parseFloat(line.debit ?? "0") > 0 ? fmt(line.debit) : ""}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-sm">
                                                            {parseFloat(line.credit ?? "0") > 0 ? fmt(line.credit) : ""}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <Separator className="my-3" />
                                        <div className="flex justify-end gap-8 text-sm font-medium px-4">
                                            <span className="text-muted-foreground">Account Total:</span>
                                            <span>Dr {fmt(group.totalDebit)}</span>
                                            <span>Cr {fmt(group.totalCredit)}</span>
                                            <span className="font-bold">Balance: {fmt(group.balance)}</span>
                                        </div>
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    ))}
                </div>
            )}

            {/* Grand Total Footer */}
            {data.accounts.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">Grand Total</span>
                            <div className="flex gap-8 font-bold text-lg">
                                <span>Dr {fmt(grandTotalDebit)}</span>
                                <span>Cr {fmt(grandTotalCredit)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
