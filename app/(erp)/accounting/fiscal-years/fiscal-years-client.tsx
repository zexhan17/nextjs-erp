"use client";

import { useState, useTransition } from "react";
import { createFiscalYearAction, deleteFiscalYearAction, toggleFiscalYearClosedAction } from "../actions";
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
import { Plus, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

interface FiscalYear {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isClosed: boolean | null;
}

export function FiscalYearsClient({ years }: { years: FiscalYear[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    async function handleCreate(formData: FormData) {
        startTransition(async () => {
            const res = await createFiscalYearAction(formData);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Fiscal year created");
                setOpen(false);
            }
        });
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this fiscal year?")) return;
        startTransition(async () => {
            const res = await deleteFiscalYearAction(id);
            if (res.error) toast.error(res.error);
            else toast.success("Fiscal year deleted");
        });
    }

    async function handleToggleClosed(id: string, close: boolean) {
        startTransition(async () => {
            const res = await toggleFiscalYearClosedAction(id, close);
            if (res.error) toast.error(res.error);
            else toast.success(close ? "Fiscal year closed" : "Fiscal year reopened");
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" />
                            New Fiscal Year
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Fiscal Year</DialogTitle>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" name="name" placeholder="FY 2025" required />
                            </div>
                            <div className="grid gap-4 grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input id="startDate" name="startDate" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input id="endDate" name="endDate" type="date" required />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Creating…" : "Create Fiscal Year"}
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
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {years.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                    No fiscal years configured.
                                </TableCell>
                            </TableRow>
                        ) : (
                            years.map((year) => (
                                <TableRow key={year.id}>
                                    <TableCell className="font-medium">{year.name}</TableCell>
                                    <TableCell>{new Date(year.startDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(year.endDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={year.isClosed ? "secondary" : "default"}>
                                            {year.isClosed ? "Closed" : "Open"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                title={year.isClosed ? "Reopen" : "Close"}
                                                onClick={() => handleToggleClosed(year.id, !year.isClosed)}
                                                disabled={isPending}
                                            >
                                                {year.isClosed ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(year.id)}
                                                disabled={isPending}
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
        </div>
    );
}
