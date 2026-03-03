import { getProductAction } from "../../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Pencil,
    Package,
    DollarSign,
    BarChart3,
    Weight,
} from "lucide-react";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
    const { id } = await params;
    const product = await getProductAction(id);
    if (!product) notFound();

    function fmt(val: string | null) {
        if (!val) return "—";
        const n = parseFloat(val);
        return isNaN(n) ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2 });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/inventory/products">
                        <Button variant="ghost" size="icon" className="size-8">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center justify-center size-12 rounded-lg bg-muted">
                        <Package className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{product.name}</h1>
                        <div className="flex items-center gap-2 text-sm">
                            {product.sku && (
                                <span className="text-muted-foreground">SKU: {product.sku}</span>
                            )}
                            <Badge variant="outline" className="text-xs capitalize">
                                {product.type}
                            </Badge>
                            <Badge
                                variant={product.isActive ? "default" : "secondary"}
                                className="text-xs"
                            >
                                {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>
                </div>
                <Link href={`/inventory/products/${id}/edit`}>
                    <Button variant="outline" size="sm">
                        <Pencil className="mr-2 size-4" />
                        Edit
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    {product.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{product.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="size-4" /> Pricing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Sale Price</p>
                                    <p className="text-lg font-semibold">{fmt(product.salePrice)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Cost Price</p>
                                    <p className="text-lg font-semibold">{fmt(product.costPrice)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Tax Rate</p>
                                    <p className="text-lg font-semibold">{fmt(product.taxRate)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BarChart3 className="size-4" /> Stock
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Current Stock</p>
                                    <p className="text-lg font-semibold">
                                        {product.trackInventory ? fmt(product.currentStock) : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Reorder Level</p>
                                    <p className="text-lg font-semibold">{fmt(product.reorderLevel)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Reorder Qty</p>
                                    <p className="text-lg font-semibold">{fmt(product.reorderQty)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {product.barcode && (
                                <div>
                                    <span className="text-muted-foreground">Barcode:</span> {product.barcode}
                                </div>
                            )}
                            {product.internalRef && (
                                <div>
                                    <span className="text-muted-foreground">Internal Ref:</span> {product.internalRef}
                                </div>
                            )}
                            {product.weight && (
                                <div>
                                    <span className="text-muted-foreground">Weight:</span>{" "}
                                    {product.weight} {product.weightUnit ?? ""}
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground">Sellable:</span>{" "}
                                {product.isSellable ? "Yes" : "No"}
                            </div>
                            <div>
                                <span className="text-muted-foreground">Purchasable:</span>{" "}
                                {product.isPurchasable ? "Yes" : "No"}
                            </div>
                            <Separator />
                            <div>
                                <span className="text-muted-foreground">Created:</span>{" "}
                                {new Date(product.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                                <span className="text-muted-foreground">Updated:</span>{" "}
                                {new Date(product.updatedAt).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Stock History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Stock movements will appear here once recorded.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
