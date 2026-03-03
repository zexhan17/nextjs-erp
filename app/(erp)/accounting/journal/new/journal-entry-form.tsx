"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createJournalEntryAction } from "../../actions";
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

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

interface JELine {
    accountId: string;
    description: string;
    debit: string;
    credit: string;
}

export function JournalEntryForm({ accounts }: { accounts: Account[] }) {
    const router = useRouter();
    const [lines, setLines] = useState<JELine[]>([
        { accountId: "", description: "", debit: "0", credit: "0" },
        { accountId: "", description: "", debit: "0", credit: "0" },
    ]);

    async function handleAction(_prev: unknown, formData: FormData) {
        formData.set("lineCount", String(lines.length));
        const result = await createJournalEntryAction(formData);
        if (result?.success && "entryId" in result) {
            router.push(`/accounting/journal/${result.entryId}`);
            return result;
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(handleAction, null);

    function addLine() {
        setLines([...lines, { accountId: "", description: "", debit: "0", credit: "0" }]);
    }

    function removeLine(idx: number) {
        if (lines.length <= 2) return;
        setLines(lines.filter((_, i) => i !== idx));
    }

    function updateLine(idx: number, field: keyof JELine, value: string) {
        setLines(lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
    }

    const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/accounting/journal">
                    <Button variant="ghost" size="icon" className="size-8">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">New Journal Entry</h1>
                    <p className="text-sm text-muted-foreground">
                        Create a balanced double-entry journal entry.
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
                        <CardTitle>Entry Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    defaultValue={new Date().toISOString().split("T")[0]}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reference">Reference</Label>
                                <Input id="reference" name="reference" placeholder="INV-001, etc." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" rows={2} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Lines</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                <Plus className="mr-2 size-4" />
                                Add Line
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                            <div className="col-span-4">Account</div>
                            <div className="col-span-3">Description</div>
                            <div className="col-span-2">Debit</div>
                            <div className="col-span-2">Credit</div>
                            <div className="col-span-1" />
                        </div>

                        {lines.map((line, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded-md p-2 md:border-0 md:p-0"
                            >
                                <div className="md:col-span-4">
                                    <Label className="md:hidden text-xs">Account</Label>
                                    <Select
                                        value={line.accountId}
                                        onValueChange={(v) => updateLine(idx, "accountId", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    {a.code} — {a.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name={`lines[${idx}].accountId`} value={line.accountId} />
                                </div>
                                <div className="md:col-span-3">
                                    <Label className="md:hidden text-xs">Description</Label>
                                    <Input
                                        name={`lines[${idx}].description`}
                                        placeholder="Optional"
                                        value={line.description}
                                        onChange={(e) => updateLine(idx, "description", e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="md:hidden text-xs">Debit</Label>
                                    <Input
                                        name={`lines[${idx}].debit`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={line.debit}
                                        onChange={(e) => updateLine(idx, "debit", e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="md:hidden text-xs">Credit</Label>
                                    <Input
                                        name={`lines[${idx}].credit`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={line.credit}
                                        onChange={(e) => updateLine(idx, "credit", e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    {lines.length > 2 && (
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
                        ))}

                        <Separator />

                        <div className="flex flex-col items-end gap-1 text-sm">
                            <div className="flex gap-8">
                                <span className="text-muted-foreground">Total Debit:</span>
                                <span>{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex gap-8">
                                <span className="text-muted-foreground">Total Credit:</span>
                                <span>{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className={`flex gap-8 font-bold text-base ${isBalanced ? "text-green-600" : "text-destructive"}`}>
                                <span>Difference:</span>
                                <span>{(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3 justify-end">
                    <Link href="/accounting/journal">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isPending || !isBalanced}>
                        {isPending ? "Creating…" : "Create Entry"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
