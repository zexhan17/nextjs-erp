"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createContactAction, updateContactAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ContactData {
    id: string;
    name: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    website: string | null;
    taxId: string | null;
    type: string;
    isOrganization: boolean;
    jobTitle: string | null;
    department: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    notes: string | null;
    isActive: boolean;
}

export function ContactForm({ contact }: { contact?: ContactData }) {
    const isEdit = !!contact;
    const router = useRouter();

    async function handleAction(_prev: unknown, formData: FormData) {
        let result;
        if (isEdit) {
            result = await updateContactAction(contact.id, formData);
        } else {
            result = await createContactAction(formData);
        }
        if (result?.success && "contactId" in result) {
            router.push(`/contacts/${result.contactId}`);
            return result;
        }
        if (result?.success) {
            router.push("/contacts");
            return result;
        }
        return result;
    }

    const [state, formAction, isPending] = useActionState(handleAction, null);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/contacts">
                    <Button variant="ghost" size="icon" className="size-8">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEdit ? `Edit ${contact.name}` : "New Contact"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {isEdit
                            ? "Update contact information."
                            : "Add a new customer, vendor, or employee."}
                    </p>
                </div>
            </div>

            <form action={formAction} className="space-y-6 max-w-3xl">
                {state?.error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {state.error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={contact?.name ?? ""}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    name="displayName"
                                    defaultValue={contact?.displayName ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue={contact?.type ?? "customer"}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="customer">Customer</SelectItem>
                                        <SelectItem value="vendor">Vendor</SelectItem>
                                        <SelectItem value="customer_vendor">Customer & Vendor</SelectItem>
                                        <SelectItem value="employee">Employee</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <input
                                    type="hidden"
                                    name="isOrganization"
                                    value={contact?.isOrganization ? "true" : "false"}
                                />
                                <Switch
                                    id="isOrganization"
                                    defaultChecked={contact?.isOrganization ?? false}
                                    onCheckedChange={(v) => {
                                        const input = document.querySelector<HTMLInputElement>(
                                            'input[name="isOrganization"]'
                                        );
                                        if (input) input.value = v ? "true" : "false";
                                    }}
                                />
                                <Label htmlFor="isOrganization">Organization (company)</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={contact?.email ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={contact?.phone ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile</Label>
                                <Input
                                    id="mobile"
                                    name="mobile"
                                    defaultValue={contact?.mobile ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    name="website"
                                    defaultValue={contact?.website ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId">Tax ID</Label>
                                <Input
                                    id="taxId"
                                    name="taxId"
                                    defaultValue={contact?.taxId ?? ""}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Position</CardTitle>
                        <CardDescription>Relevant when this is a person under an organization.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="jobTitle">Job Title</Label>
                                <Input
                                    id="jobTitle"
                                    name="jobTitle"
                                    defaultValue={contact?.jobTitle ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    name="department"
                                    defaultValue={contact?.department ?? ""}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="street">Street</Label>
                                <Input
                                    id="street"
                                    name="street"
                                    defaultValue={contact?.street ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    defaultValue={contact?.city ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    name="state"
                                    defaultValue={contact?.state ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">ZIP</Label>
                                <Input
                                    id="zip"
                                    name="zip"
                                    defaultValue={contact?.zip ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country (ISO 2)</Label>
                                <Input
                                    id="country"
                                    name="country"
                                    maxLength={2}
                                    placeholder="US"
                                    defaultValue={contact?.country ?? ""}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            name="notes"
                            rows={4}
                            placeholder="Any additional notes…"
                            defaultValue={contact?.notes ?? ""}
                        />
                    </CardContent>
                </Card>

                <Separator />

                <div className="flex gap-3 justify-end">
                    <Link href="/contacts">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={isPending}>
                        {isPending
                            ? isEdit
                                ? "Saving…"
                                : "Creating…"
                            : isEdit
                                ? "Save Changes"
                                : "Create Contact"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
