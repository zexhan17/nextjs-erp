"use client";

import { useState, useActionState, useTransition } from "react";
import { inviteUserAction, removeUserAction, updateUserRoleAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import { Plus, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
    userId: string;
    isOwner: boolean;
    userName: string;
    userEmail: string;
    userStatus: string;
    userAvatar: string | null;
    lastLogin: Date | null;
    roles: { id: string; name: string }[];
}

interface RoleOption {
    id: string;
    name: string;
    isSystem: boolean;
}

export function UsersClient({
    users,
    currentUserId,
    roles,
}: {
    users: UserRow[];
    currentUserId: string;
    roles: RoleOption[];
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [inviteState, inviteAction, invitePending] = useActionState(inviteUserAction, null);
    const [removeState, removeAction, removePending] = useActionState(removeUserAction, null);

    async function handleRoleChange(userId: string, roleId: string) {
        startTransition(async () => {
            const res = await updateUserRoleAction(userId, roleId);
            if (res.error) toast.error(res.error);
            else toast.success("Role updated");
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 size-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add User to Company</DialogTitle>
                            <DialogDescription>
                                Create a new user or invite an existing one to this company.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={inviteAction} className="space-y-4">
                            {inviteState?.error && (
                                <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                                    {inviteState.error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="invite-name">Full Name *</Label>
                                <Input id="invite-name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-email">Email *</Label>
                                <Input id="invite-email" name="email" type="email" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-password">Password *</Label>
                                <Input id="invite-password" name="password" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-role">Role</Label>
                                <Select name="roleId">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={invitePending}>
                                    {invitePending ? "Adding…" : "Add User"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {removeState?.error && (
                <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                    {removeState.error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Team Members ({users.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.userId}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8">
                                                <AvatarFallback className="text-xs">
                                                    {u.userName
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    {u.userName}
                                                    {u.isOwner && (
                                                        <Crown className="size-3.5 text-amber-500" />
                                                    )}
                                                    {u.userId === currentUserId && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                            You
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {u.userEmail}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {u.userId !== currentUserId && !u.isOwner ? (
                                            <Select
                                                defaultValue={u.roles[0]?.id ?? ""}
                                                onValueChange={(v) => handleRoleChange(u.userId, v)}
                                                disabled={isPending}
                                            >
                                                <SelectTrigger className="h-8 w-36 text-xs">
                                                    <SelectValue placeholder="No role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((r) => (
                                                        <SelectItem key={r.id} value={r.id} className="text-xs">
                                                            {r.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {u.roles.length > 0 ? (
                                                    u.roles.map((r) => (
                                                        <Badge key={r.id} variant="secondary" className="text-xs">
                                                            {r.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No role</span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={u.userStatus === "active" ? "default" : "secondary"}
                                            className="capitalize text-xs"
                                        >
                                            {u.userStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {u.lastLogin
                                            ? new Date(u.lastLogin).toLocaleDateString()
                                            : "Never"}
                                    </TableCell>
                                    <TableCell>
                                        {u.userId !== currentUserId && !u.isOwner && (
                                            <form action={() => removeAction(u.userId)}>
                                                <Button
                                                    type="submit"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-destructive"
                                                    disabled={removePending}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </form>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
