"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAccountAction, deleteAccountAction, updateAccountAction } from "../actions";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MoreHorizontal, Search, Pencil, BookOpen } from "lucide-react";
import { toast } from "sonner";

const typeColors: Record<string, string> = {
    asset: "bg-blue-100 text-blue-800",
    liability: "bg-red-100 text-red-800",
    equity: "bg-purple-100 text-purple-800",
    revenue: "bg-green-100 text-green-800",
    expense: "bg-amber-100 text-amber-800",
};

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
    description: string | null;
    isActive: boolean | null;
    balance: string | null;
}

export function AccountsClient({ accounts }: { accounts: Account[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editAccount, setEditAccount] = useState<Account | null>(null);
    const [typeFilter, setTypeFilter] = useState("all");
    const [search, setSearch] = useState("");

    const filtered = accounts.filter((a) => {
        if (typeFilter !== "all" && a.type !== typeFilter) return false;
        if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.code.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    async function handleCreate(formData: FormData) {
        startTransition(async () => {
            const res = await createAccountAction(formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Account created");
                setOpen(false);
            }
        });
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this account?")) return;
        startTransition(async () => {
            const res = await deleteAccountAction(id);
            if (res.error) toast.error(res.error);
            else toast.success("Account deleted");
        });
    }

    async function handleUpdate(formData: FormData) {
        if (!editAccount) return;
        startTransition(async () => {
            const res = await updateAccountAction(editAccount.id, formData);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Account updated");
                setEditOpen(false);
                setEditAccount(null);
            }
        });
    }

    function openEdit(account: Account) {
        setEditAccount(account);
        setEditOpen(true);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search accounts…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="asset">Asset</SelectItem>
                            <SelectItem value="liability">Liability</SelectItem>
                            <SelectItem value="equity">Equity</SelectItem>
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" />
                            New Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Account</DialogTitle>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code *</Label>
                                    <Input id="code" name="code" placeholder="1000" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select name="type" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asset">Asset</SelectItem>
                                            <SelectItem value="liability">Liability</SelectItem>
                                            <SelectItem value="equity">Equity</SelectItem>
                                            <SelectItem value="revenue">Revenue</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" name="name" placeholder="Cash" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" rows={2} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Creating…" : "Create Account"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                    No accounts found. Create your first account to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-mono text-sm">{account.code}</TableCell>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={typeColors[account.type] ?? ""}>
                                            {account.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {parseFloat(account.balance ?? "0").toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/accounting/accounts/${account.id}`}>
                                                        <BookOpen className="mr-2 size-4" />
                                                        View Ledger
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEdit(account)}>
                                                    <Pencil className="mr-2 size-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(account.id)}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                        <DialogTitle>Edit Account</DialogTitle>
                    </DialogHeader>
                    {editAccount && (
                        <form action={handleUpdate} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-code">Code *</Label>
                                    <Input id="edit-code" name="code" defaultValue={editAccount.code} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-type">Type *</Label>
                                    <Select name="type" defaultValue={editAccount.type}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asset">Asset</SelectItem>
                                            <SelectItem value="liability">Liability</SelectItem>
                                            <SelectItem value="equity">Equity</SelectItem>
                                            <SelectItem value="revenue">Revenue</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name *</Label>
                                <Input id="edit-name" name="name" defaultValue={editAccount.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea id="edit-description" name="description" rows={2} defaultValue={editAccount.description ?? ""} />
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
