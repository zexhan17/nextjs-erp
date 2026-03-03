"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteSalesOrderAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Trash2,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface OrderRow {
    id: string;
    number: string;
    status: string;
    orderDate: Date;
    total: string;
    amountPaid: string;
    currency: string;
    customerName: string;
    customerId: string;
}

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function OrdersClient({
    orders,
    total,
    page,
    search,
    statusFilter,
}: {
    orders: OrderRow[];
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
        router.push(`/sales/orders?${params.toString()}`);
    }

    function goToPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (p > 1) params.set("page", String(p));
        else params.delete("page");
        router.push(`/sales/orders?${params.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateFilters("search", searchValue);
    }

    function handleDelete(id: string) {
        if (!confirm("Delete this order?")) return;
        startTransition(async () => {
            await deleteSalesOrderAction(id);
        });
    }

    function fmt(val: string, curr: string) {
        const n = parseFloat(val);
        return isNaN(n)
            ? "—"
            : new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: curr,
            }).format(n);
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-2">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search orders…"
                                className="pl-8"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </form>
                    <Select value={statusFilter} onValueChange={(v) => updateFilters("status", v)}>
                        <SelectTrigger className="w-37.5">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Link href="/sales/orders/new">
                    <Button size="sm">
                        <Plus className="mr-2 size-4" />
                        New Order
                    </Button>
                </Link>
            </div>

            {/* Table */}
            {orders.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">Paid</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((o) => (
                                    <TableRow key={o.id}>
                                        <TableCell>
                                            <Link
                                                href={`/sales/orders/${o.id}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {o.number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{o.customerName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(o.orderDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`text-xs capitalize ${statusColors[o.status] ?? ""}`}
                                            >
                                                {o.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {fmt(o.total, o.currency)}
                                        </TableCell>
                                        <TableCell className="text-right hidden md:table-cell text-sm text-muted-foreground">
                                            {fmt(o.amountPaid, o.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/sales/orders/${o.id}`}>
                                                            <Eye className="mr-2 size-4" />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {o.status === "draft" && (
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDelete(o.id)}
                                                        >
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
                    icon={ShoppingCart}
                    title="No sales orders"
                    description="Create your first sales order to track customer purchases."
                    action={
                        <Link href="/sales/orders/new">
                            <Button>
                                <Plus className="mr-2 size-4" />
                                New Order
                            </Button>
                        </Link>
                    }
                />
            )}

            {/* Pagination */}
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
