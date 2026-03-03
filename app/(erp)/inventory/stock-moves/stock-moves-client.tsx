"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createStockMoveAction } from "../actions";
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
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Search, ArrowRightLeft, ChevronLeft, ChevronRight, ArrowDownToLine, ArrowUpFromLine, Repeat, SlidersHorizontal, Undo2, Plus,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

interface StockMoveRow {
    id: string;
    type: string;
    quantity: string;
    reference: string | null;
    referenceType: string | null;
    notes: string | null;
    movedAt: Date;
    productName: string;
    productSku: string | null;
    productId: string;
    warehouseName: string;
    warehouseId: string;
}

const typeConfig: Record<string, { label: string; color: string; icon: typeof ArrowDownToLine }> = {
    in: { label: "In", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: ArrowDownToLine },
    out: { label: "Out", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: ArrowUpFromLine },
    transfer: { label: "Transfer", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Repeat },
    adjustment: { label: "Adjustment", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: SlidersHorizontal },
    return: { label: "Return", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", icon: Undo2 },
};

export function StockMovesClient({
    moves,
    total,
    page,
    search,
    typeFilter,
    products,
    warehouses,
}: {
    moves: StockMoveRow[];
    total: number;
    page: number;
    search: string;
    typeFilter: string;
    products: { id: string; name: string; sku: string | null }[];
    warehouses: { id: string; name: string }[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(search);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const perPage = 25;
    const totalPages = Math.ceil(total / perPage);

    function updateFilters(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") params.set(key, value);
        else params.delete(key);
        params.delete("page");
        router.push(`/inventory/stock-moves?${params.toString()}`);
    }

    function goToPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (p > 1) params.set("page", String(p));
        else params.delete("page");
        router.push(`/inventory/stock-moves?${params.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateFilters("search", searchValue);
    }

    function handleCreate(formData: FormData) {
        startTransition(async () => {
            const res = await createStockMoveAction(formData);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Stock move recorded");
                setDialogOpen(false);
            }
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-2">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search product or reference…"
                                className="pl-8"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </form>
                    <Select value={typeFilter} onValueChange={(v) => updateFilters("type", v)}>
                        <SelectTrigger className="w-37.5">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="in">In</SelectItem>
                            <SelectItem value="out">Out</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                            <SelectItem value="return">Return</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 size-4" />
                            New Stock Move
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record Stock Move</DialogTitle>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sm-product">Product *</Label>
                                <Select name="productId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}{p.sku ? ` (${p.sku})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sm-warehouse">Warehouse *</Label>
                                <Select name="warehouseId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select warehouse" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sm-type">Type *</Label>
                                    <Select name="type" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="in">In</SelectItem>
                                            <SelectItem value="out">Out</SelectItem>
                                            <SelectItem value="adjustment">Adjustment</SelectItem>
                                            <SelectItem value="return">Return</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sm-qty">Quantity *</Label>
                                    <Input id="sm-qty" name="quantity" type="number" step="0.01" min="0.01" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sm-ref">Reference</Label>
                                <Input id="sm-ref" name="reference" placeholder="e.g. PO-0001" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sm-notes">Notes</Label>
                                <Textarea id="sm-notes" name="notes" rows={2} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Recording…" : "Record Move"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {moves.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Warehouse</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="hidden md:table-cell">Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {moves.map((m) => {
                                    const config = typeConfig[m.type] ?? { label: m.type, color: "", icon: ArrowRightLeft };
                                    return (
                                        <TableRow key={m.id}>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-xs ${config.color}`}>
                                                    {config.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{m.productName}</div>
                                                {m.productSku && (
                                                    <div className="text-xs text-muted-foreground">{m.productSku}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">{m.warehouseName}</TableCell>
                                            <TableCell className="text-right font-medium tabular-nums">
                                                {(m.type === "in" || m.type === "return") ? "+" : "−"}{parseFloat(m.quantity).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {m.reference ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(m.movedAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-48 truncate">
                                                {m.notes ?? "—"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <EmptyState
                    icon={ArrowRightLeft}
                    title="No stock moves"
                    description="Stock movement history will appear here as you record inventory changes through purchases, sales, and manual adjustments."
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
