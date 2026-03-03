"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteProductAction } from "../actions";
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
    Pencil,
    Trash2,
    Package,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface Product {
    id: string;
    name: string;
    sku: string | null;
    type: string;
    salePrice: string | null;
    costPrice: string | null;
    currentStock: string | null;
    reorderLevel: string | null;
    trackInventory: boolean;
    isActive: boolean;
    image: string | null;
    createdAt: Date;
}

const typeLabels: Record<string, string> = {
    goods: "Goods",
    service: "Service",
    consumable: "Consumable",
};

export function ProductsClient({
    products,
    total,
    page,
    search,
    typeFilter,
}: {
    products: Product[];
    total: number;
    page: number;
    search: string;
    typeFilter: string;
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
        router.push(`/inventory/products?${params.toString()}`);
    }

    function goToPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (p > 1) params.set("page", String(p));
        else params.delete("page");
        router.push(`/inventory/products?${params.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateFilters("search", searchValue);
    }

    function handleDelete(id: string) {
        if (!confirm("Delete this product?")) return;
        startTransition(async () => {
            await deleteProductAction(id);
        });
    }

    function formatCurrency(val: string | null) {
        if (!val) return "—";
        const n = parseFloat(val);
        return isNaN(n) ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2 });
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
                                placeholder="Search products…"
                                className="pl-8"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </form>
                    <Select value={typeFilter} onValueChange={(v) => updateFilters("type", v)}>
                        <SelectTrigger className="w-35">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="goods">Goods</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="consumable">Consumable</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Link href="/inventory/products/new">
                    <Button size="sm">
                        <Plus className="mr-2 size-4" />
                        New Product
                    </Button>
                </Link>
            </div>

            {/* Table */}
            {products.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Sale Price</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="hidden md:table-cell">Status</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((p) => {
                                    const stock = parseFloat(p.currentStock ?? "0");
                                    const reorder = parseFloat(p.reorderLevel ?? "0");
                                    const lowStock = p.trackInventory && reorder > 0 && stock <= reorder;

                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/inventory/products/${p.id}`}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div className="flex items-center justify-center size-8 rounded bg-muted">
                                                        <Package className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{p.name}</div>
                                                        {p.sku && (
                                                            <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                                                        )}
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs capitalize">
                                                    {typeLabels[p.type] ?? p.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                {formatCurrency(p.salePrice)}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {formatCurrency(p.costPrice)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {lowStock && (
                                                        <AlertTriangle className="size-3.5 text-amber-500" />
                                                    )}
                                                    <span className={`text-sm ${lowStock ? "text-amber-600 font-medium" : ""}`}>
                                                        {p.trackInventory ? stock.toLocaleString() : "N/A"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge
                                                    variant={p.isActive ? "default" : "secondary"}
                                                    className="text-xs"
                                                >
                                                    {p.isActive ? "Active" : "Inactive"}
                                                </Badge>
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
                                                            <Link href={`/inventory/products/${p.id}`}>
                                                                <Eye className="mr-2 size-4" />
                                                                View
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/inventory/products/${p.id}/edit`}>
                                                                <Pencil className="mr-2 size-4" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDelete(p.id)}
                                                        >
                                                            <Trash2 className="mr-2 size-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                    icon={Package}
                    title="No products yet"
                    description="Create your first product to start managing inventory."
                    action={
                        <Link href="/inventory/products/new">
                            <Button>
                                <Plus className="mr-2 size-4" />
                                New Product
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
