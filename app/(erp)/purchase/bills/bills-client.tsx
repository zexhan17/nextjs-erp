"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteVendorBillAction, updateVendorBillStatusAction } from "../actions";
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
    Search, MoreHorizontal, Trash2, FileText, ChevronLeft, ChevronRight, CheckCircle, Ban, Plus,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface BillRow {
    id: string;
    number: string;
    status: string;
    billDate: Date;
    dueDate: Date | null;
    total: string | null;
    amountPaid: string | null;
    currency: string | null;
    reference: string | null;
    vendorName: string;
    vendorId: string;
}

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    received: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    partially_paid: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

export function VendorBillsClient({
    bills,
    total,
    page,
    search,
    statusFilter,
}: {
    bills: BillRow[];
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
        router.push(`/purchase/bills?${params.toString()}`);
    }

    function goToPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (p > 1) params.set("page", String(p));
        else params.delete("page");
        router.push(`/purchase/bills?${params.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateFilters("search", searchValue);
    }

    function handleDelete(id: string) {
        if (!confirm("Delete this bill?")) return;
        startTransition(async () => {
            await deleteVendorBillAction(id);
        });
    }

    function handleStatusChange(id: string, status: string) {
        startTransition(async () => {
            await updateVendorBillStatusAction(id, status);
        });
    }

    function fmt(val: string | null, curr: string | null) {
        if (!val) return "—";
        const n = parseFloat(val);
        return isNaN(n) ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: curr || "USD" }).format(n);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-2">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search bills…"
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
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Link href="/purchase/bills/new">
                    <Button>
                        <Plus className="mr-2 size-4" />
                        New Bill
                    </Button>
                </Link>
            </div>

            {bills.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bill #</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Bill Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">Paid</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bills.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">{b.number}</TableCell>
                                        <TableCell>{b.vendorName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(b.billDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-xs capitalize ${statusColors[b.status] ?? ""}`}>
                                                {b.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {fmt(b.total, b.currency)}
                                        </TableCell>
                                        <TableCell className="text-right hidden md:table-cell text-sm text-muted-foreground">
                                            {fmt(b.amountPaid, b.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {b.status === "draft" && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(b.id, "received")}>
                                                            <CheckCircle className="mr-2 size-4" />
                                                            Mark Received
                                                        </DropdownMenuItem>
                                                    )}
                                                    {(b.status === "received" || b.status === "partially_paid") && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(b.id, "paid")}>
                                                            <CheckCircle className="mr-2 size-4" />
                                                            Mark as Paid
                                                        </DropdownMenuItem>
                                                    )}
                                                    {b.status !== "cancelled" && b.status !== "paid" && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(b.id, "cancelled")}>
                                                            <Ban className="mr-2 size-4" />
                                                            Cancel
                                                        </DropdownMenuItem>
                                                    )}
                                                    {b.status === "draft" && (
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(b.id)}>
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
                    icon={FileText}
                    title="No vendor bills"
                    description="Vendor bills will appear here once you start receiving invoices from your suppliers."
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
