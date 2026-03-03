"use client";

import { useState, useActionState, useTransition } from "react";
import { createRoleAction, deleteRoleAction, updateRoleAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Plus, Trash2, Shield, Users, Pencil } from "lucide-react";
import { toast } from "sonner";

interface RoleRow {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    memberCount: number;
}

export function RolesClient({ roles }: { roles: RoleRow[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editRole, setEditRole] = useState<RoleRow | null>(null);
    const [isPending, startTransition] = useTransition();
    const [createState, createAction, createPending] = useActionState(createRoleAction, null);
    const [deleteState, deleteAction, deletePending] = useActionState(deleteRoleAction, null);

    async function handleUpdate(formData: FormData) {
        if (!editRole) return;
        startTransition(async () => {
            const res = await updateRoleAction(editRole.id, formData);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Role updated");
                setEditOpen(false);
                setEditRole(null);
            }
        });
    }

    function openEdit(role: RoleRow) {
        setEditRole(role);
        setEditOpen(true);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 size-4" />
                            Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                            <DialogDescription>
                                Create a role to group permissions and assign to users.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={createAction} className="space-y-4">
                            {createState?.error && (
                                <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                                    {createState.error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="role-name">Role Name *</Label>
                                <Input id="role-name" name="name" placeholder="e.g. Sales Manager" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role-desc">Description</Label>
                                <Textarea
                                    id="role-desc"
                                    name="description"
                                    placeholder="What can this role do?"
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createPending}>
                                    {createPending ? "Creating…" : "Create Role"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {deleteState?.error && (
                <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                    {deleteState.error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Roles ({roles.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Shield className="size-4 text-muted-foreground" />
                                            <div>
                                                <div className="font-medium">{role.name}</div>
                                                {role.description && (
                                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                                        {role.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <Users className="size-3.5 text-muted-foreground" />
                                            {role.memberCount}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={role.isSystem ? "default" : "outline"} className="text-xs">
                                            {role.isSystem ? "System" : "Custom"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(role.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {!role.isSystem && (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-foreground"
                                                    onClick={() => openEdit(role)}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <form action={() => deleteAction(role.id)}>
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground hover:text-destructive"
                                                        disabled={deletePending}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {roles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No roles defined yet. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                    </DialogHeader>
                    {editRole && (
                        <form action={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-role-name">Role Name *</Label>
                                <Input id="edit-role-name" name="name" defaultValue={editRole.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-role-desc">Description</Label>
                                <Textarea
                                    id="edit-role-desc"
                                    name="description"
                                    defaultValue={editRole.description ?? ""}
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Saving…" : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
