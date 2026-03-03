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
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Filter, Printer, TrendingUp, TrendingDown } from "lucide-react";

function fmt(val: number) {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface IncomeStatementData {
    revenue: { code: string; name: string; amount: number }[];
    expenses: { code: string; name: string; amount: number }[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
}

interface FiscalYear {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isClosed: boolean | null;
}

export function IncomeStatementClient({
    data,
    fiscalYears,
    currentStartDate,
    currentEndDate,
    currentFiscalYearId,
}: {
    data: IncomeStatementData | null;
    fiscalYears: FiscalYear[];
    currentStartDate?: string;
    currentEndDate?: string;
    currentFiscalYearId?: string;
}) {
    const router = useRouter();

    function handleFilter(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const sp = new URLSearchParams();
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        const fyId = formData.get("fiscalYearId") as string;
        if (startDate) sp.set("startDate", startDate);
        if (endDate) sp.set("endDate", endDate);
        if (fyId && fyId !== "none") sp.set("fiscalYearId", fyId);
        router.push(`/accounting/reports/income-statement?${sp.toString()}`);
    }

    function handleClear() {
        router.push("/accounting/reports/income-statement");
    }

    function handlePrint() {
        window.print();
    }

    if (!data) {
        return <p className="text-muted-foreground text-center py-8">No active company.</p>;
    }

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
                        {(currentStartDate || currentEndDate || currentFiscalYearId) && (
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
                <h1 className="text-2xl font-bold">Income Statement (Profit & Loss)</h1>
                <p className="text-sm">
                    {currentStartDate && currentEndDate
                        ? `${new Date(currentStartDate).toLocaleDateString()} — ${new Date(currentEndDate).toLocaleDateString()}`
                        : "All Time"}
                </p>
            </div>

            {/* Net Income Summary */}
            <Card className={data.netIncome >= 0 ? "border-green-200" : "border-red-200"}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {data.netIncome >= 0 ? (
                                <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                                    <TrendingUp className="size-5 text-green-600" />
                                </div>
                            ) : (
                                <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                                    <TrendingDown className="size-5 text-red-600" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {data.netIncome >= 0 ? "Net Profit" : "Net Loss"}
                                </p>
                                <p className={`text-3xl font-bold ${data.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {fmt(data.netIncome)}
                                </p>
                            </div>
                        </div>
                        {data.totalRevenue > 0 && (
                            <Badge variant="secondary" className="text-sm">
                                Margin: {((data.netIncome / data.totalRevenue) * 100).toFixed(1)}%
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Revenue
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs font-normal">
                                {data.revenue.length} accounts
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Code</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.revenue.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                            No revenue recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.revenue.map((r) => (
                                        <TableRow key={r.code}>
                                            <TableCell className="font-mono text-sm">{r.code}</TableCell>
                                            <TableCell>{r.name}</TableCell>
                                            <TableCell className="text-right font-medium text-green-600">
                                                {fmt(r.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Separator className="my-3" />
                        <div className="flex justify-between font-bold text-lg px-4">
                            <span>Total Revenue</span>
                            <span className="text-green-600">{fmt(data.totalRevenue)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Expenses
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs font-normal">
                                {data.expenses.length} accounts
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Code</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                            No expenses recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.expenses.map((e) => (
                                        <TableRow key={e.code}>
                                            <TableCell className="font-mono text-sm">{e.code}</TableCell>
                                            <TableCell>{e.name}</TableCell>
                                            <TableCell className="text-right font-medium text-red-600">
                                                {fmt(e.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Separator className="my-3" />
                        <div className="flex justify-between font-bold text-lg px-4">
                            <span>Total Expenses</span>
                            <span className="text-red-600">{fmt(data.totalExpenses)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Net Income Summary Bottom */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Revenue</span>
                            <span className="font-medium">{fmt(data.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Expenses</span>
                            <span className="font-medium">({fmt(data.totalExpenses)})</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Net Income</span>
                            <span className={data.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                                {fmt(data.netIncome)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
