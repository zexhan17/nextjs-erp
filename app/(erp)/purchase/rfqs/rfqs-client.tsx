"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteRFQAction } from "../actions";
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
    quoted: "bg-purple-100 text-purple-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-amber-100 text-amber-800",
};

interface RFQ {
    id: string;
    number: string;
    status: string;
    date: Date;
    validUntil: Date | null;
    total: string | null;
    currency: string | null;
    vendorName: string;
}

export function RFQsClient({
    rfqs,
    total,
    page,
    search,
    status,
}: {
    rfqs: RFQ[];
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
        router.push(`/purchase/rfqs?${sp.toString()}`);
    }

    function fmt(val: string | null, currency = "USD") {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
        }).format(parseFloat(val ?? "0"));
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this draft RFQ?")) return;
        const res = await deleteRFQAction(id);
        if (res.error) toast.error(res.error);
        else toast.success("RFQ deleted");
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search RFQs…"
                        defaultValue={search}
                        className="pl-9"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                navigate({ search: (e.target as HTMLInputElement).value, page: "1" });
                            }
                        }}
                    />
                </div>
                <Select value={status} onValueChange={(v) => navigate({ status: v, page: "1" })}>
                    <SelectTrigger className="w-45">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
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
                            <TableHead>Valid Until</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rfqs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                    No RFQs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rfqs.map((rfq) => (
                                <TableRow key={rfq.id}>
                                    <TableCell>
                                        <Link href={`/purchase/rfqs/${rfq.id}`} className="font-medium hover:underline">
                                            {rfq.number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{rfq.vendorName}</TableCell>
                                    <TableCell>{new Date(rfq.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {rfq.validUntil ? new Date(rfq.validUntil).toLocaleDateString() : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={statusColors[rfq.status] ?? ""}>
                                            {rfq.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {fmt(rfq.total, rfq.currency ?? "USD")}
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
                                                    <Link href={`/purchase/rfqs/${rfq.id}`}>View</Link>
                                                </DropdownMenuItem>
                                                {rfq.status === "draft" && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDelete(rfq.id)}
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
                        {total} RFQ{total !== 1 ? "s" : ""}
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
