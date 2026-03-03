"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteContactAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    Building2,
    User,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface Contact {
    id: string;
    name: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    type: string;
    isOrganization: boolean;
    isActive: boolean;
    city: string | null;
    country: string | null;
    createdAt: Date;
}

const typeLabel: Record<string, string> = {
    customer: "Customer",
    vendor: "Vendor",
    customer_vendor: "Customer & Vendor",
    employee: "Employee",
    other: "Other",
};

const typeBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    customer: "default",
    vendor: "secondary",
    customer_vendor: "outline",
    employee: "outline",
    other: "outline",
};

export function ContactsClient({
    contacts,
    total,
    page,
    search,
    typeFilter,
}: {
    contacts: Contact[];
    total: number;
    page: number;
    search: string;
    typeFilter: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(search);
    const [isPending, startTransition] = useTransition();

    const perPage = 25;
    const totalPages = Math.ceil(total / perPage);

    function updateFilters(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page");
        router.push(`/contacts?${params.toString()}`);
    }

    function goToPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        if (p > 1) params.set("page", String(p));
        else params.delete("page");
        router.push(`/contacts?${params.toString()}`);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        updateFilters("search", searchValue);
    }

    function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this contact?")) return;
        startTransition(async () => {
            await deleteContactAction(id);
        });
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 gap-2">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search contacts…"
                                className="pl-8"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </form>
                    <Select value={typeFilter} onValueChange={(v) => updateFilters("type", v)}>
                        <SelectTrigger className="w-37.5">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="customer">Customers</SelectItem>
                            <SelectItem value="vendor">Vendors</SelectItem>
                            <SelectItem value="customer_vendor">Both</SelectItem>
                            <SelectItem value="employee">Employees</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Link href="/contacts/new">
                    <Button size="sm">
                        <Plus className="mr-2 size-4" />
                        New Contact
                    </Button>
                </Link>
            </div>

            {/* Data Table */}
            {contacts.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="hidden md:table-cell">Email</TableHead>
                                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((contact) => (
                                    <TableRow key={contact.id} className="cursor-pointer">
                                        <TableCell>
                                            <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
                                                <Avatar className="size-8">
                                                    <AvatarFallback className="text-xs">
                                                        {contact.isOrganization ? (
                                                            <Building2 className="size-3.5" />
                                                        ) : (
                                                            contact.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()
                                                                .slice(0, 2)
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{contact.name}</div>
                                                    {contact.isOrganization && (
                                                        <div className="text-xs text-muted-foreground">Organization</div>
                                                    )}
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={typeBadgeVariant[contact.type] ?? "outline"} className="text-xs capitalize">
                                                {typeLabel[contact.type] ?? contact.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                            {contact.email ?? "—"}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                            {contact.phone ?? "—"}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                            {[contact.city, contact.country].filter(Boolean).join(", ") || "—"}
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
                                                        <Link href={`/contacts/${contact.id}`}>
                                                            <Eye className="mr-2 size-4" />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/contacts/${contact.id}/edit`}>
                                                            <Pencil className="mr-2 size-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(contact.id)}
                                                    >
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
                    icon={User}
                    title="No contacts yet"
                    description="Create your first contact to start managing customers, vendors, and more."
                    action={
                        <Link href="/contacts/new">
                            <Button>
                                <Plus className="mr-2 size-4" />
                                New Contact
                            </Button>
                        </Link>
                    }
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={page <= 1}
                            onClick={() => goToPage(page - 1)}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={page >= totalPages}
                            onClick={() => goToPage(page + 1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
