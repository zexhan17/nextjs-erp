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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { CreditCard, Search, ArrowDownLeft, ArrowUpRight, DollarSign } from "lucide-react";
import { useCallback, useMemo } from "react";

function fmt(val: string | number | null) {
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

interface IncomingPayment {
    id: string;
    number: string;
    contactName: string | null;
    amount: string;
    currency: string;
    method: string;
    reference: string | null;
    date: Date;
    invoiceNumber: string | null;
}

interface OutgoingPayment {
    id: string;
    contactName: string | null;
    amount: string;
    currency: string | null;
    method: string | null;
    reference: string | null;
    date: Date;
    billNumber: string | null;
}

interface Props {
    incoming: IncomingPayment[];
    outgoing: OutgoingPayment[];
    search: string;
    typeFilter: string;
}

export function PaymentsClient({ incoming, outgoing, search, typeFilter }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateParams = useCallback(
        (updates: Record<string, string>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value && value !== "all") {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            }
            router.push(`/accounting/payments?${params.toString()}`);
        },
        [router, searchParams]
    );

    const totalIncoming = useMemo(
        () => incoming.reduce((s, p) => s + parseFloat(p.amount), 0),
        [incoming]
    );
    const totalOutgoing = useMemo(
        () => outgoing.reduce((s, p) => s + parseFloat(p.amount), 0),
        [outgoing]
    );

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold">Payments</h2>
                <p className="text-sm text-muted-foreground">
                    Consolidated view of all incoming (customer) and outgoing (vendor) payments.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Incoming Payments</CardTitle>
                        <ArrowDownLeft className="size-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{fmt(totalIncoming)}</div>
                        <p className="text-xs text-muted-foreground">{incoming.length} payment{incoming.length !== 1 ? "s" : ""} from customers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Outgoing Payments</CardTitle>
                        <ArrowUpRight className="size-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{fmt(totalOutgoing)}</div>
                        <p className="text-xs text-muted-foreground">{outgoing.length} payment{outgoing.length !== 1 ? "s" : ""} to vendors</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                        <DollarSign className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalIncoming - totalOutgoing >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {fmt(totalIncoming - totalOutgoing)}
                        </div>
                        <p className="text-xs text-muted-foreground">Incoming minus outgoing</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-50 max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search payments..."
                        defaultValue={search}
                        className="pl-9"
                        onChange={(e) => {
                            const timer = setTimeout(() => updateParams({ search: e.target.value }), 400);
                            return () => clearTimeout(timer);
                        }}
                    />
                </div>
                <Select value={typeFilter} onValueChange={(v) => updateParams({ type: v })}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="incoming">Incoming Only</SelectItem>
                        <SelectItem value="outgoing">Outgoing Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="incoming" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="incoming">
                        <ArrowDownLeft className="mr-1.5 size-3.5" />
                        Incoming ({incoming.length})
                    </TabsTrigger>
                    <TabsTrigger value="outgoing">
                        <ArrowUpRight className="mr-1.5 size-3.5" />
                        Outgoing ({outgoing.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="incoming">
                    {incoming.length === 0 ? (
                        <EmptyState
                            icon={CreditCard}
                            title="No incoming payments"
                            description="Customer payments will appear here."
                        />
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Number</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incoming.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.number}</TableCell>
                                            <TableCell>{p.contactName ?? "—"}</TableCell>
                                            <TableCell className="text-muted-foreground">{p.invoiceNumber ?? "—"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{p.method.replace("_", " ")}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{p.reference ?? "—"}</TableCell>
                                            <TableCell>{fmtDate(p.date)}</TableCell>
                                            <TableCell className="text-right font-medium text-green-600">{fmt(p.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="outgoing">
                    {outgoing.length === 0 ? (
                        <EmptyState
                            icon={CreditCard}
                            title="No outgoing payments"
                            description="Vendor payments will appear here."
                        />
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Bill</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {outgoing.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.contactName ?? "—"}</TableCell>
                                            <TableCell className="text-muted-foreground">{p.billNumber ?? "—"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{(p.method ?? "other").replace("_", " ")}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{p.reference ?? "—"}</TableCell>
                                            <TableCell>{fmtDate(p.date)}</TableCell>
                                            <TableCell className="text-right font-medium text-red-600">{fmt(p.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
