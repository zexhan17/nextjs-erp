"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteInvoiceAction, updateInvoiceStatusAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Search, MoreHorizontal, Trash2, Receipt, ChevronLeft, ChevronRight, Send, Ban, Plus,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface InvoiceRow {
    id: string;
    number: string;
    status: string;
    issueDate: Date;
    dueDate: Date | null;
    total: string;
    amountPaid: string;
    balanceDue: string;
    currency: string;
    customerName: string | null;
    customerId: string;
}

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    partially_paid: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
    refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

export function InvoicesClient({
    invoices,
    total,
    page,
    search,
    statusFilter,
}: {
    invoices: InvoiceRow[];
    total: number;
    page: number;
    search: string;
    statusFilter: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(search);
    const [isPending, startTransition] = useTransition();

    const perPage = 25;
    const totalPages = Math.ceil(total / perPage);

    function updateFilters(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") params.set(key, value);
        else params.delete(key);
        params.delete("page");
        router.push(`/sales/invoices?${params.toString()}`);
    }

    function goToPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (p > 1) params.set("page", String(p));
        else params.delete("page");
        router.push(`/sales/invoices?${params.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateFilters("search", searchValue);
    }

    function handleDelete(id: string) {
        if (!confirm("Delete this invoice?")) return;
        startTransition(async () => {
            await deleteInvoiceAction(id);
        });
    }

    function handleStatusChange(id: string, status: string) {
        startTransition(async () => {
            await updateInvoiceStatusAction(id, status);
        });
    }

    function fmt(val: string, curr: string) {
        const n = parseFloat(val);
        return isNaN(n) ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(n);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-2">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search invoices…"
                                className="pl-8"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </form>
                    <Select value={statusFilter} onValueChange={(v) => updateFilters("status", v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Link href="/sales/invoices/new">
                    <Button>
                        <Plus className="mr-2 size-4" />
                        New Invoice
                    </Button>
                </Link>
            </div>

            {invoices.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Issue Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">Balance</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.number}</TableCell>
                                        <TableCell>{inv.customerName ?? "—"}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(inv.issueDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-xs capitalize ${statusColors[inv.status] ?? ""}`}>
                                                {inv.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {fmt(inv.total, inv.currency)}
                                        </TableCell>
                                        <TableCell className="text-right hidden md:table-cell text-sm text-muted-foreground">
                                            {fmt(inv.balanceDue, inv.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {inv.status === "draft" && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(inv.id, "sent")}>
                                                            <Send className="mr-2 size-4" />
                                                            Mark as Sent
                                                        </DropdownMenuItem>
                                                    )}
                                                    {(inv.status === "sent" || inv.status === "partially_paid") && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(inv.id, "paid")}>
                                                            <Receipt className="mr-2 size-4" />
                                                            Mark as Paid
                                                        </DropdownMenuItem>
                                                    )}
                                                    {inv.status !== "cancelled" && inv.status !== "paid" && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(inv.id, "cancelled")}>
                                                            <Ban className="mr-2 size-4" />
                                                            Cancel
                                                        </DropdownMenuItem>
                                                    )}
                                                    {inv.status === "draft" && (
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(inv.id)}>
                                                            <Trash2 className="mr-2 size-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <EmptyState
                    icon={Receipt}
                    title="No invoices"
                    description="Create your first invoice to bill your customers for goods and services."
                />
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
                    </p>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
