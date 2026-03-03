"use client";

import { useState, useActionState, useTransition } from "react";
import { createWarehouseAction, updateWarehouseAction, deleteWarehouseAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Warehouse, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

interface WarehouseRow {
    id: string;
    name: string;
    code: string;
    address: string | null;
    city: string | null;
    country: string | null;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
}

export function WarehousesClient({ warehouses }: { warehouses: WarehouseRow[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editWarehouse, setEditWarehouse] = useState<WarehouseRow | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createState, createAction, creating] = useActionState(createWarehouseAction, null);
    const [isPending, startTransition] = useTransition();

    function handleEdit(wh: WarehouseRow) {
        setEditWarehouse(wh);
        setEditDialogOpen(true);
    }

    function handleEditSubmit(formData: FormData) {
        if (!editWarehouse) return;
        startTransition(async () => {
            const res = await updateWarehouseAction(editWarehouse.id, formData);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Warehouse updated");
                setEditDialogOpen(false);
                setEditWarehouse(null);
            }
        });
    }

    function handleDelete(id: string) {
        if (!confirm("Delete this warehouse?")) return;
        startTransition(async () => {
            const res = await deleteWarehouseAction(id);
            if (res.error) toast.error(res.error);
            else toast.success("Warehouse deleted");
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 size-4" />
                            New Warehouse
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Warehouse</DialogTitle>
                        </DialogHeader>
                        <form action={createAction} className="space-y-4">
                            {createState?.error && (
                                <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                                    {createState.error}
                                </div>
                            )}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="wh-name">Name *</Label>
                                    <Input id="wh-name" name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wh-code">Code *</Label>
                                    <Input id="wh-code" name="code" placeholder="WH01" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wh-address">Address</Label>
                                <Input id="wh-address" name="address" />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="wh-city">City</Label>
                                    <Input id="wh-city" name="city" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wh-country">Country (ISO 2)</Label>
                                    <Input id="wh-country" name="country" maxLength={2} placeholder="US" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={creating}>
                                    {creating ? "Creating…" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Warehouse</DialogTitle>
                    </DialogHeader>
                    <form action={handleEditSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-wh-name">Name *</Label>
                                <Input id="edit-wh-name" name="name" defaultValue={editWarehouse?.name ?? ""} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-wh-code">Code *</Label>
                                <Input id="edit-wh-code" name="code" defaultValue={editWarehouse?.code ?? ""} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-wh-address">Address</Label>
                            <Input id="edit-wh-address" name="address" defaultValue={editWarehouse?.address ?? ""} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-wh-city">City</Label>
                                <Input id="edit-wh-city" name="city" defaultValue={editWarehouse?.city ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-wh-country">Country (ISO 2)</Label>
                                <Input id="edit-wh-country" name="country" maxLength={2} defaultValue={editWarehouse?.country ?? ""} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving…" : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {warehouses.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Warehouses ({warehouses.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {warehouses.map((w) => (
                                    <TableRow key={w.id}>
                                        <TableCell className="font-medium">
                                            {w.name}
                                            {w.isDefault && (
                                                <Badge variant="outline" className="ml-2 text-[10px]">
                                                    Default
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">{w.code}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {[w.city, w.country].filter(Boolean).join(", ") || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={w.isActive ? "default" : "secondary"}
                                                className="text-xs"
                                            >
                                                {w.isActive ? "Active" : "Inactive"}
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
                                                    <DropdownMenuItem onClick={() => handleEdit(w)}>
                                                        <Pencil className="mr-2 size-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(w.id)}>
                                                        <Trash2 className="mr-2 size-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <EmptyState
                    icon={Warehouse}
                    title="No warehouses"
                    description="Create a warehouse to track stock locations."
                    action={
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="mr-2 size-4" />
                            New Warehouse
                        </Button>
                    }
                />
            )}
        </div>
    );
}
