"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRFQAction } from "../../actions";
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

interface Vendor {
    id: string;
    name: string;
    email: string | null;
}

interface LineItem {
    description: string;
    quantity: string;
    discount: string;
    taxRate: string;
}

export function RFQForm({ vendors }: { vendors: Vendor[] }) {
    const router = useRouter();
    const [lines, setLines] = useState<LineItem[]>([
        { description: "", quantity: "1", discount: "0", taxRate: "0" },
    ]);

    async function handleAction(_prev: unknown, formData: FormData) {
        formData.set("lineCount", String(lines.length));
        const result = await createRFQAction(formData);
        if (result?.success && "rfqId" in result) {
            router.push("/purchase/rfqs");
            return result;
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(handleAction, null);

    function addLine() {
        setLines([...lines, { description: "", quantity: "1", discount: "0", taxRate: "0" }]);
    }

    function removeLine(idx: number) {
        setLines(lines.filter((_, i) => i !== idx));
    }

    function updateLine(idx: number, field: keyof LineItem, value: string) {
        setLines(lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    }

    // RFQ doesn't have unit price initially, so just show line count
    const subtotal = 0;
    const taxAmount = 0;
    const total = 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/purchase/rfqs">
                    <Button variant="ghost" size="icon" className="size-8">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">New Request for Quotation</h1>
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
                                <CardTitle>RFQ Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                        <Label htmlFor="validUntil">Valid Until</Label>
                                        <Input id="validUntil" name="validUntil" type="date" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Items Requested</CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                        <Plus className="mr-2 size-4" /> Add Item
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {lines.map((line, idx) => (
                                    <div key={idx} className="grid gap-2 sm:grid-cols-12 items-end border-b pb-3 last:border-0">
                                        <div className="sm:col-span-5 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Description *</Label>}
                                            <Input
                                                name={`lines[${idx}].description`}
                                                placeholder="Item description"
                                                value={line.description}
                                                onChange={(e) => updateLine(idx, "description", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Qty</Label>}
                                            <Input
                                                name={`lines[${idx}].quantity`}
                                                type="number" step="0.01" min="0.01"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                                                placeholder="1"
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Disc %</Label>}
                                            <Input
                                                name={`lines[${idx}].discount`}
                                                type="number" step="0.01"
                                                value={line.discount}
                                                onChange={(e) => updateLine(idx, "discount", e.target.value)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            {idx === 0 && <Label className="text-xs">Tax %</Label>}
                                            <Input
                                                name={`lines[${idx}].taxRate`}
                                                type="number" step="0.01"
                                                value={line.taxRate}
                                                onChange={(e) => updateLine(idx, "taxRate", e.target.value)}
                                                placeholder="0"
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
                                        <span className="text-muted-foreground">Items Requested</span>
                                        <span>{lines.length}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Vendor will provide pricing when they receive this RFQ.
                                    </p>
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
                                    <Label htmlFor="date">RFQ Date</Label>
                                    <Input id="date" name="date" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea id="notes" name="notes" rows={3} placeholder="Any special requirements..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="terms">Delivery Terms</Label>
                                    <Textarea id="terms" name="terms" rows={3} placeholder="Delivery terms, payment terms, etc." />
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Creating…" : "Create RFQ"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
