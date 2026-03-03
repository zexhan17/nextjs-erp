"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    posted: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

interface Entry {
    id: string;
    number: string;
    date: Date;
    status: string;
    description: string | null;
    reference: string | null;
    totalDebit: string | null;
    totalCredit: string | null;
}

export function JournalClient({
    entries,
    total,
    page,
    search,
    status,
}: {
    entries: Entry[];
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
        router.push(`/accounting/journal?${sp.toString()}`);
    }

    function fmt(val: string | null) {
        return parseFloat(val ?? "0").toLocaleString(undefined, { minimumFractionDigits: 2 });
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search entries…"
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
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                    No journal entries found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>
                                        <Link
                                            href={`/accounting/journal/${entry.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {entry.number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground">
                                        {entry.description || entry.reference || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={statusColors[entry.status] ?? ""}>
                                            {entry.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{fmt(entry.totalDebit)}</TableCell>
                                    <TableCell className="text-right font-medium">{fmt(entry.totalCredit)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{total} entries</p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline" size="icon" className="size-8"
                            disabled={page <= 1}
                            onClick={() => navigate({ page: String(page - 1) })}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-sm">{page} / {totalPages}</span>
                        <Button
                            variant="outline" size="icon" className="size-8"
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
