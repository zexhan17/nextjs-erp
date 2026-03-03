"use client";

import { useRouter } from "next/navigation";
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
    TableFooter,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Filter, Printer, Download } from "lucide-react";

const typeColors: Record<string, string> = {
    asset: "bg-blue-100 text-blue-800",
    liability: "bg-red-100 text-red-800",
    equity: "bg-purple-100 text-purple-800",
    revenue: "bg-green-100 text-green-800",
    expense: "bg-amber-100 text-amber-800",
};

function fmt(val: number) {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TrialBalanceRow {
    id: string;
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
    balance: number;
    debitBalance: number;
    creditBalance: number;
}

interface FiscalYear {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isClosed: boolean | null;
}

export function TrialBalanceClient({
    data,
    fiscalYears,
    currentDate,
    currentFiscalYearId,
}: {
    data: { rows: TrialBalanceRow[]; totalDebits: number; totalCredits: number } | null;
    fiscalYears: FiscalYear[];
    currentDate?: string;
    currentFiscalYearId?: string;
}) {
    const router = useRouter();

    function handleFilter(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const sp = new URLSearchParams();
        const date = formData.get("date") as string;
        const fyId = formData.get("fiscalYearId") as string;
        if (date) sp.set("date", date);
        if (fyId && fyId !== "none") sp.set("fiscalYearId", fyId);
        router.push(`/accounting/reports/trial-balance?${sp.toString()}`);
    }

    function handleClear() {
        router.push("/accounting/reports/trial-balance");
    }

    function handlePrint() {
        window.print();
    }

    if (!data) {
        return <p className="text-muted-foreground text-center py-8">No active company.</p>;
    }

    const isBalanced = Math.abs(data.totalDebits - data.totalCredits) < 0.01;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card className="print:hidden">
                <CardContent className="pt-6">
                    <form onSubmit={handleFilter} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="space-y-1">
                            <Label htmlFor="date" className="text-xs">As of Date</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={currentDate ?? ""}
                                className="w-40"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Fiscal Year</Label>
                            <Select name="fiscalYearId" defaultValue={currentFiscalYearId ?? "none"}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">All Time</SelectItem>
                                    {fiscalYears.map((fy) => (
                                        <SelectItem key={fy.id} value={fy.id}>
                                            {fy.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                            <Filter className="mr-2 size-4" />
                            Apply
                        </Button>
                        {(currentDate || currentFiscalYearId) && (
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

            {/* Report Header (for print) */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-2xl font-bold">Trial Balance</h1>
                {currentDate && <p className="text-sm">As of {new Date(currentDate).toLocaleDateString()}</p>}
            </div>

            {/* Balance Check */}
            <div className="flex items-center gap-2">
                <Badge variant={isBalanced ? "default" : "destructive"} className="text-sm">
                    {isBalanced ? "Balanced ✓" : "Unbalanced ✗"}
                </Badge>
                {!isBalanced && (
                    <span className="text-sm text-destructive">
                        Difference: {fmt(Math.abs(data.totalDebits - data.totalCredits))}
                    </span>
                )}
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24">Code</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                        No posted transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.rows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-mono text-sm">{row.code}</TableCell>
                                        <TableCell className="font-medium">{row.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={`text-xs ${typeColors[row.type] ?? ""}`}>
                                                {row.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {row.debitBalance > 0 ? fmt(row.debitBalance) : ""}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {row.creditBalance > 0 ? fmt(row.creditBalance) : ""}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        {data.rows.length > 0 && (
                            <TableFooter>
                                <TableRow className="font-bold">
                                    <TableCell colSpan={3}>Total</TableCell>
                                    <TableCell className="text-right">{fmt(data.totalDebits)}</TableCell>
                                    <TableCell className="text-right">{fmt(data.totalCredits)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
