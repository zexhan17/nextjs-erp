import Link from "next/link";
import { getAccountingDashboardAction } from "../actions";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Landmark,
    BookOpen,
    FileSpreadsheet,
    Plus,
    ArrowRight,
} from "lucide-react";

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    posted: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

function fmt(val: number) {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AccountingDashboardPage() {
    const data = await getAccountingDashboardAction();

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No active company selected.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Accounting Dashboard</h2>
                    <p className="text-sm text-muted-foreground">
                        Financial overview for your company.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/accounting/journal/new">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            New Journal Entry
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Key Financial Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Assets"
                    value={fmt(data.totalAssets)}
                    icon={<Landmark className="size-4" />}
                    description="Sum of all asset accounts"
                />
                <StatCard
                    title="Total Liabilities"
                    value={fmt(data.totalLiabilities)}
                    icon={<DollarSign className="size-4" />}
                    description="Sum of all liability accounts"
                />
                <StatCard
                    title="Revenue"
                    value={fmt(data.totalRevenue)}
                    icon={<TrendingUp className="size-4" />}
                    description="Total revenue earned"
                />
                <StatCard
                    title="Net Income"
                    value={fmt(data.netIncome)}
                    icon={data.netIncome >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                    description="Revenue minus expenses"
                    trend={data.totalRevenue > 0 ? {
                        value: Math.round((data.netIncome / data.totalRevenue) * 100),
                        isPositive: data.netIncome >= 0,
                    } : undefined}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="size-4 text-muted-foreground" />
                            Chart of Accounts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalAccounts}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(data.balanceByType).map(([type, val]) => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                    {type}: {val.count}
                                </Badge>
                            ))}
                        </div>
                        <Link href="/accounting/accounts" className="mt-3 inline-flex items-center text-sm text-primary hover:underline">
                            View accounts <ArrowRight className="ml-1 size-3" />
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileSpreadsheet className="size-4 text-muted-foreground" />
                            Journal Entries
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalJournalEntries}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total entries</p>
                        <div className="mt-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Draft</span>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800">{data.draftEntries}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Posted</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">{data.postedEntries}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Cancelled</span>
                                <Badge variant="secondary" className="bg-red-100 text-red-800">{data.cancelledEntries}</Badge>
                            </div>
                        </div>
                        <Link href="/accounting/journal" className="mt-3 inline-flex items-center text-sm text-primary hover:underline">
                            View journal <ArrowRight className="ml-1 size-3" />
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="size-4 text-muted-foreground" />
                            Financial Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Assets</span>
                                <span className="font-medium">{fmt(data.totalAssets)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Liabilities</span>
                                <span className="font-medium">{fmt(data.totalLiabilities)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Equity</span>
                                <span className="font-medium">{fmt(data.totalEquity)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between">
                                <span className="text-muted-foreground">Revenue</span>
                                <span className="font-medium text-green-600">{fmt(data.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Expenses</span>
                                <span className="font-medium text-red-600">{fmt(data.totalExpenses)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Net Income</span>
                                <span className={data.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                                    {fmt(data.netIncome)}
                                </span>
                            </div>
                        </div>
                        <Link href="/accounting/reports" className="mt-3 inline-flex items-center text-sm text-primary hover:underline">
                            View reports <ArrowRight className="ml-1 size-3" />
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Journal Entries */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent Journal Entries</CardTitle>
                        <Link href="/accounting/journal">
                            <Button variant="outline" size="sm">
                                View All
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {data.recentEntries.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6">No journal entries yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.recentEntries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>
                                            <Link
                                                href={`/accounting/journal/${entry.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {entry.number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(entry.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-muted-foreground">
                                            {entry.description || entry.reference || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={statusColors[entry.status] ?? ""}>
                                                {entry.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {parseFloat(entry.totalDebit ?? "0").toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
