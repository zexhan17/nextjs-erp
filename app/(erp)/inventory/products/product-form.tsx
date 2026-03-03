"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProductAction, updateProductAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

interface ProductData {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    internalRef: string | null;
    description: string | null;
    type: string;
    salePrice: string | null;
    costPrice: string | null;
    taxRate: string | null;
    trackInventory: boolean;
    reorderLevel: string | null;
    reorderQty: string | null;
    weight: string | null;
    weightUnit: string | null;
    isSellable: boolean;
    isPurchasable: boolean;
    isActive: boolean;
}

export function ProductForm({ product }: { product?: ProductData }) {
    const isEdit = !!product;
    const router = useRouter();

    async function handleAction(_prev: unknown, formData: FormData) {
        let result;
        if (isEdit) {
            result = await updateProductAction(product.id, formData);
        } else {
            result = await createProductAction(formData);
        }
        if (result?.success && "productId" in result) {
            router.push(`/inventory/products/${result.productId}`);
            return result;
        }
        if (result?.success) {
            router.push("/inventory/products");
            return result;
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(handleAction, null);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/inventory/products">
                    <Button variant="ghost" size="icon" className="size-8">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEdit ? `Edit ${product.name}` : "New Product"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isEdit ? "Update product information." : "Add a new product to your catalog."}
                    </p>
                </div>
            </div>

            <form action={formAction} className="space-y-6 max-w-3xl">
                {state?.error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {state.error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input id="name" name="name" defaultValue={product?.name ?? ""} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue={product?.type ?? "goods"}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="goods">Goods</SelectItem>
                                        <SelectItem value="service">Service</SelectItem>
                                        <SelectItem value="consumable">Consumable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="barcode">Barcode</Label>
                                <Input id="barcode" name="barcode" defaultValue={product?.barcode ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="internalRef">Internal Reference</Label>
                                <Input id="internalRef" name="internalRef" defaultValue={product?.internalRef ?? ""} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    defaultValue={product?.description ?? ""}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="salePrice">Sale Price</Label>
                                <Input
                                    id="salePrice"
                                    name="salePrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={product?.salePrice ?? "0"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="costPrice">Cost Price</Label>
                                <Input
                                    id="costPrice"
                                    name="costPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={product?.costPrice ?? "0"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                                <Input
                                    id="taxRate"
                                    name="taxRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={product?.taxRate ?? "0"}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Inventory</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="hidden"
                                name="trackInventory"
                                value={product?.trackInventory !== false ? "true" : "false"}
                            />
                            <Switch
                                id="trackInventory"
                                defaultChecked={product?.trackInventory !== false}
                                onCheckedChange={(v) => {
                                    const input = document.querySelector<HTMLInputElement>(
                                        'input[name="trackInventory"]'
                                    );
                                    if (input) input.value = v ? "true" : "false";
                                }}
                            />
                            <Label htmlFor="trackInventory">Track inventory for this product</Label>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="reorderLevel">Reorder Level</Label>
                                <Input
                                    id="reorderLevel"
                                    name="reorderLevel"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={product?.reorderLevel ?? "0"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reorderQty">Reorder Quantity</Label>
                                <Input
                                    id="reorderQty"
                                    name="reorderQty"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={product?.reorderQty ?? "0"}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Physical</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight</Label>
                                <Input
                                    id="weight"
                                    name="weight"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={product?.weight ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weightUnit">Weight Unit</Label>
                                <Input
                                    id="weightUnit"
                                    name="weightUnit"
                                    placeholder="kg"
                                    defaultValue={product?.weightUnit ?? ""}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <input type="hidden" name="isSellable" value={product?.isSellable !== false ? "true" : "false"} />
                            <Switch
                                id="isSellable"
                                defaultChecked={product?.isSellable !== false}
                                onCheckedChange={(v) => {
                                    const input = document.querySelector<HTMLInputElement>('input[name="isSellable"]');
                                    if (input) input.value = v ? "true" : "false";
                                }}
                            />
                            <Label htmlFor="isSellable">Can be sold</Label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="hidden" name="isPurchasable" value={product?.isPurchasable !== false ? "true" : "false"} />
                            <Switch
                                id="isPurchasable"
                                defaultChecked={product?.isPurchasable !== false}
                                onCheckedChange={(v) => {
                                    const input = document.querySelector<HTMLInputElement>('input[name="isPurchasable"]');
                                    if (input) input.value = v ? "true" : "false";
                                }}
                            />
                            <Label htmlFor="isPurchasable">Can be purchased</Label>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                <div className="flex gap-3 justify-end">
                    <Link href="/inventory/products">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create Product"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
