"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deletePurchaseOrderAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    confirmed: "bg-indigo-100 text-indigo-800",
    received: "bg-green-100 text-green-800",
    partially_received: "bg-amber-100 text-amber-800",
    cancelled: "bg-red-100 text-red-800",
};

interface Order {
    id: string;
    number: string;
    status: string;
    orderDate: Date;
    expectedDate: Date | null;
    total: string | null;
    amountPaid: string | null;
    currency: string | null;
    vendorName: string;
}

export function PurchaseOrdersClient({
    orders,
    total,
    page,
    search,
    status,
}: {
    orders: Order[];
    total: number;
    page: number;
    search: string;
    status: string;
}) {
    const router = useRouter();
    const limit = 25;
    const totalPages = Math.ceil(total / limit);

    function navigate(params: Record<string, string>) {
        const sp = new URLSearchParams();
        const merged = { page: String(page), search, status, ...params };
        for (const [k, v] of Object.entries(merged)) {
            if (v && v !== "all" && v !== "1" && v !== "") sp.set(k, v);
        }
        router.push(`/purchase/orders?${sp.toString()}`);
    }

    function fmt(val: string | null, currency = "USD") {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
        }).format(parseFloat(val ?? "0"));
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this draft order?")) return;
        const res = await deletePurchaseOrderAction(id);
        if (res.error) toast.error(res.error);
        else toast.success("Order deleted");
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search orders…"
                        defaultValue={search}
                        className="pl-9"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                navigate({ search: (e.target as HTMLInputElement).value, page: "1" });
                            }
                        }}
                    />
                </div>
                <Select
                    value={status}
                    onValueChange={(v) => navigate({ status: v, page: "1" })}
                >
                    <SelectTrigger className="w-45">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="partially_received">Partially Received</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Number</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                    No purchase orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <Link href={`/purchase/orders/${order.id}`} className="font-medium hover:underline">
                                            {order.number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{order.vendorName}</TableCell>
                                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={statusColors[order.status] ?? ""}>
                                            {order.status.replace("_", " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {fmt(order.total, order.currency ?? "USD")}
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
                                                    <Link href={`/purchase/orders/${order.id}`}>View</Link>
                                                </DropdownMenuItem>
                                                {order.status === "draft" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDelete(order.id)}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {total} order{total !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={page <= 1}
                            onClick={() => navigate({ page: String(page - 1) })}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={page >= totalPages}
                            onClick={() => navigate({ page: String(page + 1) })}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
