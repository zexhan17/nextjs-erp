"use client";

import { useState, useActionState, useTransition } from "react";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "../actions";
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
import { Plus, FolderTree, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
}

export function CategoriesClient({ categories }: { categories: Category[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createState, createAction, creating] = useActionState(createCategoryAction, null);
    const [isPending, startTransition] = useTransition();

    function handleEdit(cat: Category) {
        setEditCategory(cat);
        setEditDialogOpen(true);
    }

    function handleEditSubmit(formData: FormData) {
        if (!editCategory) return;
        startTransition(async () => {
            const res = await updateCategoryAction(editCategory.id, formData);
            if (res.error) toast.error(res.error);
            else {
                toast.success("Category updated");
                setEditDialogOpen(false);
                setEditCategory(null);
            }
        });
    }

    function handleDelete(id: string) {
        if (!confirm("Delete this category?")) return;
        startTransition(async () => {
            const res = await deleteCategoryAction(id);
            if (res.error) toast.error(res.error);
            else toast.success("Category deleted");
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 size-4" />
                            New Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Category</DialogTitle>
                        </DialogHeader>
                        <form action={createAction} className="space-y-4">
                            {createState?.error && (
                                <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">
                                    {createState.error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="cat-name">Name *</Label>
                                <Input id="cat-name" name="name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cat-desc">Description</Label>
                                <Input id="cat-desc" name="description" />
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
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <form action={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-cat-name">Name *</Label>
                            <Input id="edit-cat-name" name="name" defaultValue={editCategory?.name ?? ""} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-cat-desc">Description</Label>
                            <Input id="edit-cat-desc" name="description" defaultValue={editCategory?.description ?? ""} />
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

            {categories.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Categories ({categories.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-12" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {c.description ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(c)}>
                                                        <Pencil className="mr-2 size-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c.id)}>
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
                    icon={FolderTree}
                    title="No categories"
                    description="Create categories to organize your products."
                    action={
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="mr-2 size-4" />
                            New Category
                        </Button>
                    }
                />
            )}
        </div>
    );
}
