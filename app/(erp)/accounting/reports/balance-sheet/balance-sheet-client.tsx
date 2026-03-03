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
import { Separator } from "@/components/ui/separator";
import { Filter, Printer } from "lucide-react";

function fmt(val: number) {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface BalanceSheetData {
    assets: { code: string; name: string; balance: number }[];
    liabilities: { code: string; name: string; balance: number }[];
    equity: { code: string; name: string; balance: number }[];
    retainedEarnings: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
}

export function BalanceSheetClient({
    data,
    currentDate,
}: {
    data: BalanceSheetData | null;
    currentDate?: string;
}) {
    const router = useRouter();

    function handleFilter(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const date = formData.get("date") as string;
        const sp = new URLSearchParams();
        if (date) sp.set("date", date);
        router.push(`/accounting/reports/balance-sheet?${sp.toString()}`);
    }

    function handleClear() {
        router.push("/accounting/reports/balance-sheet");
    }

    function handlePrint() {
        window.print();
    }

    if (!data) {
        return <p className="text-muted-foreground text-center py-8">No active company.</p>;
    }

    const isBalanced = Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity) < 0.01;

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
                        <Button type="submit" variant="secondary" size="sm">
                            <Filter className="mr-2 size-4" />
                            Apply
                        </Button>
                        {currentDate && (
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
                <h1 className="text-2xl font-bold">Balance Sheet</h1>
                <p className="text-sm">
                    As of {currentDate ? new Date(currentDate).toLocaleDateString() : "All Time"}
                </p>
            </div>

            {/* Balance Check */}
            <div className="flex items-center gap-2">
                <Badge variant={isBalanced ? "default" : "destructive"} className="text-sm">
                    {isBalanced ? "Balanced ✓" : "Unbalanced ✗"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                    Assets = Liabilities + Equity
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Assets */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Assets
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs font-normal">
                                {data.assets.length} accounts
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
                                {data.assets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                            No asset accounts with balances.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.assets.map((a) => (
                                        <TableRow key={a.code}>
                                            <TableCell className="font-mono text-sm">{a.code}</TableCell>
                                            <TableCell>{a.name}</TableCell>
                                            <TableCell className="text-right font-medium">{fmt(a.balance)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Separator className="my-3" />
                        <div className="flex justify-between font-bold text-lg px-4">
                            <span>Total Assets</span>
                            <span>{fmt(data.totalAssets)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Liabilities & Equity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Liabilities & Equity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Liabilities */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                Liabilities
                                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs font-normal">
                                    {data.liabilities.length}
                                </Badge>
                            </h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">Code</TableHead>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.liabilities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                                No liability accounts with balances.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.liabilities.map((a) => (
                                            <TableRow key={a.code}>
                                                <TableCell className="font-mono text-sm">{a.code}</TableCell>
                                                <TableCell>{a.name}</TableCell>
                                                <TableCell className="text-right font-medium">{fmt(a.balance)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <div className="flex justify-between font-medium text-sm px-4 mt-2">
                                <span>Subtotal Liabilities</span>
                                <span>{fmt(data.totalLiabilities)}</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Equity */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                Equity
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs font-normal">
                                    {data.equity.length}
                                </Badge>
                            </h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">Code</TableHead>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.equity.map((a) => (
                                        <TableRow key={a.code}>
                                            <TableCell className="font-mono text-sm">{a.code}</TableCell>
                                            <TableCell>{a.name}</TableCell>
                                            <TableCell className="text-right font-medium">{fmt(a.balance)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {data.retainedEarnings !== 0 && (
                                        <TableRow>
                                            <TableCell className="font-mono text-sm">—</TableCell>
                                            <TableCell className="italic">Retained Earnings (Net Income)</TableCell>
                                            <TableCell className={`text-right font-medium ${data.retainedEarnings >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {fmt(data.retainedEarnings)}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <div className="flex justify-between font-medium text-sm px-4 mt-2">
                                <span>Subtotal Equity</span>
                                <span>{fmt(data.totalEquity)}</span>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex justify-between font-bold text-lg px-4">
                            <span>Total Liabilities & Equity</span>
                            <span>{fmt(data.totalLiabilitiesAndEquity)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
