"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSalesOrderAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Customer {
    id: string;
    name: string;
    email: string | null;
}

interface LineItem {
    description: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    taxRate: string;
}

export function OrderForm({ customers }: { customers: Customer[] }) {
    const router = useRouter();
    const [lines, setLines] = useState<LineItem[]>([
        { description: "", quantity: "1", unitPrice: "0", discount: "0", taxRate: "0" },
    ]);

    async function handleAction(_prev: unknown, formData: FormData) {
        // Inject line count
        formData.set("lineCount", String(lines.length));
        const result = await createSalesOrderAction(formData);
        if (result?.success && "orderId" in result) {
            router.push(`/sales/orders/${result.orderId}`);
            return result;
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(handleAction, null);

    function addLine() {
        setLines([...lines, { description: "", quantity: "1", unitPrice: "0", discount: "0", taxRate: "0" }]);
    }

    function removeLine(idx: number) {
        setLines(lines.filter((_, i) => i !== idx));
    }

    function updateLine(idx: number, field: keyof LineItem, value: string) {
        setLines(lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    }

    // Calculate totals
    const subtotal = lines.reduce((sum, line) => {
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unitPrice) || 0;
        const disc = (parseFloat(line.discount) || 0) / 100;
        return sum + qty * price * (1 - disc);
    }, 0);

    const taxAmount = lines.reduce((sum, line) => {
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unitPrice) || 0;
        const disc = (parseFloat(line.discount) || 0) / 100;
        const tax = (parseFloat(line.taxRate) || 0) / 100;
        return sum + qty * price * (1 - disc) * tax;
    }, 0);

    const total = subtotal + taxAmount;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/sales/orders">
                    <Button variant="ghost" size="icon" className="size-8">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">New Sales Order</h1>
                    <p className="text-sm text-muted-foreground">
                        Create a new sales order for a customer.
                    </p>
                </div>
            </div>

            <form action={formAction} className="space-y-6 max-w-4xl">
                {state?.error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {state.error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="customerId">Customer *</Label>
                                <Select name="customerId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deliveryDate">Expected Delivery</Label>
                                <Input id="deliveryDate" name="deliveryDate" type="date" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="shippingAddress">Shipping Address</Label>
                                <Input id="shippingAddress" name="shippingAddress" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Line Items</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                <Plus className="mr-2 size-4" />
                                Add Line
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Header */}
                        <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                            <div className="col-span-4">Description</div>
                            <div className="col-span-2">Qty</div>
                            <div className="col-span-2">Unit Price</div>
                            <div className="col-span-1">Disc %</div>
                            <div className="col-span-1">Tax %</div>
                            <div className="col-span-1 text-right">Total</div>
                            <div className="col-span-1" />
                        </div>

                        {lines.map((line, idx) => {
                            const qty = parseFloat(line.quantity) || 0;
                            const price = parseFloat(line.unitPrice) || 0;
                            const disc = (parseFloat(line.discount) || 0) / 100;
                            const tax = (parseFloat(line.taxRate) || 0) / 100;
                            const lineTotal = qty * price * (1 - disc) * (1 + tax);

                            return (
                                <div
                                    key={idx}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded-md p-2 md:border-0 md:p-0"
                                >
                                    <div className="md:col-span-4">
                                        <Label className="md:hidden text-xs">Description</Label>
                                        <Input
                                            name={`lines[${idx}].description`}
                                            placeholder="Item description"
                                            value={line.description}
                                            onChange={(e) => updateLine(idx, "description", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="md:hidden text-xs">Quantity</Label>
                                        <Input
                                            name={`lines[${idx}].quantity`}
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={line.quantity}
                                            onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="md:hidden text-xs">Unit Price</Label>
                                        <Input
                                            name={`lines[${idx}].unitPrice`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={line.unitPrice}
                                            onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="md:hidden text-xs">Discount %</Label>
                                        <Input
                                            name={`lines[${idx}].discount`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={line.discount}
                                            onChange={(e) => updateLine(idx, "discount", e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="md:hidden text-xs">Tax %</Label>
                                        <Input
                                            name={`lines[${idx}].taxRate`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={line.taxRate}
                                            onChange={(e) => updateLine(idx, "taxRate", e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-1 text-right text-sm font-medium pt-1">
                                        {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="md:col-span-1 flex justify-end">
                                        {lines.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeLine(idx)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <Separator />

                        {/* Totals */}
                        <div className="flex flex-col items-end gap-1 text-sm">
                            <div className="flex gap-8">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex gap-8">
                                <span className="text-muted-foreground">Tax:</span>
                                <span>{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex gap-8 font-bold text-base">
                                <span>Total:</span>
                                <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="notes">Internal Notes</Label>
                            <Textarea id="notes" name="notes" rows={3} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="terms">Terms & Conditions</Label>
                            <Textarea id="terms" name="terms" rows={3} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3 justify-end">
                    <Link href="/sales/orders">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating…" : "Create Order"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
