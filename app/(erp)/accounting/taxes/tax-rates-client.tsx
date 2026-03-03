"use client";

import { useState, useTransition } from "react";
import { createTaxRateAction, deleteTaxRateAction, updateTaxRateAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface TaxRate {
    id: string;
    name: string;
    rate: string;
    description: string | null;
    isActive: boolean | null;
    isDefault: boolean | null;
}

export function TaxRatesClient({ rates }: { rates: TaxRate[] }) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editRate, setEditRate] = useState<TaxRate | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleCreate(formData: FormData) {
        startTransition(async () => {
            const res = await createTaxRateAction(formData);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Tax rate created");
                setOpen(false);
            }
        });
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this tax rate?")) return;
        startTransition(async () => {
            const res = await deleteTaxRateAction(id);
            if (res.error) toast.error(res.error);
            else toast.success("Tax rate deleted");
        });
    }

    async function handleUpdate(formData: FormData) {
        if (!editRate) return;
        startTransition(async () => {
            const res = await updateTaxRateAction(editRate.id, formData);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Tax rate updated");
                setEditOpen(false);
                setEditRate(null);
            }
        });
    }

    function openEdit(rate: TaxRate) {
        setEditRate(rate);
        setEditOpen(true);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" />
                            New Tax Rate
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Tax Rate</DialogTitle>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" name="name" placeholder="VAT 20%" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate">Rate (%) *</Label>
                                <Input id="rate" name="rate" type="number" step="0.01" placeholder="20" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" name="description" />
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Creating…" : "Create Tax Rate"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                    No tax rates configured.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rates.map((rate) => (
                                <TableRow key={rate.id}>
                                    <TableCell className="font-medium">
                                        {rate.name}
                                        {rate.isDefault && (
                                            <Badge variant="outline" className="ml-2">Default</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {rate.rate}%
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {rate.description || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={rate.isActive ? "default" : "secondary"}>
                                            {rate.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => openEdit(rate)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(rate.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Tax Rate</DialogTitle>
                    </DialogHeader>
                    {editRate && (
                        <form action={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name *</Label>
                                <Input id="edit-name" name="name" defaultValue={editRate.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-rate">Rate (%) *</Label>
                                <Input id="edit-rate" name="rate" type="number" step="0.01" defaultValue={editRate.rate} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input id="edit-description" name="description" defaultValue={editRate.description ?? ""} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Saving…" : "Save Changes"}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
