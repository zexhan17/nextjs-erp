"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    partially_paid: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-500",
    refunded: "bg-orange-100 text-orange-800",
};

function fmt(val: string | null) {
    const n = parseFloat(val ?? "0");
    return isNaN(n)
        ? "$0.00"
        : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtDate(d: Date | string | null) {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

interface Invoice {
    id: string;
    number: string;
    customerName: string | null;
    customerId: string;
    status: string;
    issueDate: Date;
    dueDate: Date | null;
    total: string;
    amountPaid: string;
    balanceDue: string;
    currency: string;
}

interface Props {
    invoices: Invoice[];
    total: number;
    page: number;
    search: string;
    statusFilter: string;
}

export function InvoicesClient({ invoices, total, page, search, statusFilter }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const totalPages = Math.ceil(total / 25);

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
            if (updates.search !== undefined || updates.status !== undefined) {
                params.delete("page");
            }
            router.push(`/accounting/invoices?${params.toString()}`);
        },
        [router, searchParams]
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Invoices</h2>
                    <p className="text-sm text-muted-foreground">
                        All customer invoices from a financial perspective.
                    </p>
                </div>
                <Link href="/sales/invoices/new">
                    <Button>
                        <Receipt className="mr-2 size-4" />
                        New Invoice
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-50 max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search invoices..."
                        defaultValue={search}
                        className="pl-9"
                        onChange={(e) => {
                            const timer = setTimeout(() => updateParams({ search: e.target.value }), 400);
                            return () => clearTimeout(timer);
                        }}
                    />
                </div>
                <Select value={statusFilter} onValueChange={(v) => updateParams({ status: v })}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">{total} invoice{total !== 1 ? "s" : ""}</span>
            </div>

            {/* Table */}
            {invoices.length === 0 ? (
                <EmptyState
                    icon={Receipt}
                    title="No invoices found"
                    description={search || statusFilter !== "all" ? "Try adjusting your filters." : "Create your first invoice from the Sales module."}
                    action={
                        <Link href="/sales/invoices/new">
                            <Button>Create Invoice</Button>
                        </Link>
                    }
                />
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Issue Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Balance Due</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/sales/invoices/${inv.id}`} className="hover:underline text-primary">
                                            {inv.number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{inv.customerName ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={statusColors[inv.status] ?? ""}>
                                            {inv.status.replace("_", " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{fmtDate(inv.issueDate)}</TableCell>
                                    <TableCell>{fmtDate(inv.dueDate)}</TableCell>
                                    <TableCell className="text-right">{fmt(inv.total)}</TableCell>
                                    <TableCell className="text-right">{fmt(inv.amountPaid)}</TableCell>
                                    <TableCell className="text-right font-medium">{fmt(inv.balanceDue)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => updateParams({ page: String(page - 1) })}
                        >
                            <ChevronLeft className="mr-1 size-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => updateParams({ page: String(page + 1) })}
                        >
                            Next
                            <ChevronRight className="ml-1 size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
