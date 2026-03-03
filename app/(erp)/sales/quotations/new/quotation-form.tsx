"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createQuotationAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

export function QuotationForm({ customers }: { customers: Customer[] }) {
    const router = useRouter();
    const [lines, setLines] = useState<LineItem[]>([
        { description: "", quantity: "1", unitPrice: "0", discount: "0", taxRate: "0" },
    ]);

    async function handleAction(_prev: unknown, formData: FormData) {
        formData.set("lineCount", String(lines.length));
        const result = await createQuotationAction(formData);
        if (result?.success && "quotationId" in result) {
            router.push("/sales/quotations");
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
                <Link href="/sales/quotations">
                    <Button variant="ghost" size="icon" className="size-8">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">New Quotation</h1>
            </div>

            <form action={formAction}>
                {state?.error && (
                    <div className="rounded bg-destructive/10 p-3 text-sm text-destructive mb-4">
                        {state.error}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quotation Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="customerId">Customer *</Label>
                                        <Select name="customerId" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="validUntil">Valid Until</Label>
                                        <Input id="validUntil" name="validUntil" type="date" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Line Items</CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                        <Plus className="mr-2 size-4" /> Add Line
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {lines.map((line, idx) => (
                                    <div key={idx} className="grid gap-2 sm:grid-cols-12 items-end border-b pb-3 last:border-0">
                                        <div className="sm:col-span-4 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Description *</Label>}
                                            <Input
                                                name={`lines[${idx}].description`}
                                                placeholder="Item description"
                                                value={line.description}
                                                onChange={(e) => updateLine(idx, "description", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-1 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Qty</Label>}
                                            <Input
                                                name={`lines[${idx}].quantity`}
                                                type="number" step="0.01" min="0.01"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Unit Price</Label>}
                                            <Input
                                                name={`lines[${idx}].unitPrice`}
                                                type="number" step="0.01"
                                                value={line.unitPrice}
                                                onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Disc %</Label>}
                                            <Input
                                                name={`lines[${idx}].discount`}
                                                type="number" step="0.01"
                                                value={line.discount}
                                                onChange={(e) => updateLine(idx, "discount", e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Tax %</Label>}
                                            <Input
                                                name={`lines[${idx}].taxRate`}
                                                type="number" step="0.01"
                                                value={line.taxRate}
                                                onChange={(e) => updateLine(idx, "taxRate", e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-1">
                                            {lines.length > 1 && (
                                                <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => removeLine(idx)}>
                                                    <Trash2 className="size-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Separator />
                                <div className="flex flex-col items-end gap-1 text-sm">
                                    <div className="flex gap-12">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-12">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>${taxAmount.toFixed(2)}</span>
                                    </div>
                                    <Separator className="my-1 w-48" />
                                    <div className="flex gap-12 text-base font-bold">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Additional Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea id="notes" name="notes" rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="terms">Terms & Conditions</Label>
                                    <Textarea id="terms" name="terms" rows={3} />
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Creating…" : "Create Quotation"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
