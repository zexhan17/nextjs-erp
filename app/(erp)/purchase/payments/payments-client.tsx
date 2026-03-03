"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteVendorPaymentAction, createVendorPaymentAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Search, MoreHorizontal, Trash2, CreditCard, ChevronLeft, ChevronRight, Plus,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

interface VendorPaymentRow {
    id: string;
    amount: string;
    currency: string | null;
    method: string | null;
    reference: string | null;
    paymentDate: Date;
    notes: string | null;
    vendorName: string;
    vendorId: string;
    vendorBillId: string | null;
}

export function VendorPaymentsClient({
    payments,
    total,
    page,
    search,
    vendors,
    bills,
}: {
    payments: VendorPaymentRow[];
    total: number;
    page: number;
    search: string;
    vendors: { id: string; name: string }[];
    bills: { id: string; number: string; total: string | null; vendorName: string }[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(search);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);

    const perPage = 25;
    const totalPages = Math.ceil(total / perPage);

    function updateFilters(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        params.delete("page");
        router.push(`/purchase/payments?${params.toString()}`);
    }

    function goToPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (p > 1) params.set("page", String(p));
        else params.delete("page");
        router.push(`/purchase/payments?${params.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateFilters("search", searchValue);
    }

    function handleDelete(id: string) {
        if (!confirm("Delete this payment? This will reverse the amount on any linked bill.")) return;
        startTransition(async () => {
            await deleteVendorPaymentAction(id);
        });
    }

    async function handleCreate(formData: FormData) {
        startTransition(async () => {
            const res = await createVendorPaymentAction(formData);
            if (res && "error" in res) toast.error(res.error);
            else {
                toast.success("Payment recorded");
                setDialogOpen(false);
            }
        });
    }

    function fmt(val: string, curr: string | null) {
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
                                placeholder="Search payments…"
                                className="pl-8"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </form>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Record Payment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Record Vendor Payment</DialogTitle>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="vendorId">Vendor *</Label>
                                    <Select name="vendorId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select vendor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vendors.map((v) => (
                                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendorBillId">Bill</Label>
                                    <Select name="vendorBillId">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Link to bill" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bills.map((b) => (
                                                <SelectItem key={b.id} value={b.id}>
                                                    {b.number} — {b.vendorName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="method">Method</Label>
                                    <Select name="method" defaultValue="bank_transfer">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="credit_card">Credit Card</SelectItem>
                                            <SelectItem value="check">Check</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="paymentDate">Payment Date</Label>
                                    <Input id="paymentDate" name="paymentDate" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input id="reference" name="reference" placeholder="Check #, TXN ID…" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" name="notes" rows={2} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Recording…" : "Record Payment"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {payments.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.vendorName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(p.paymentDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {p.method ? (
                                                <Badge variant="outline" className="text-xs capitalize">
                                                    {p.method.replace("_", " ")}
                                                </Badge>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {p.reference ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {fmt(p.amount, p.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p.id)}>
                                                        <Trash2 className="mr-2 size-4" />
                                                        Delete
                                                    </DropdownMenuItem>
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
                    icon={CreditCard}
                    title="No vendor payments"
                    description="Payments to vendors will appear here once recorded against bills."
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
