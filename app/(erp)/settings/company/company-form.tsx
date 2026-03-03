"use client";

import { useActionState } from "react";
import { updateCompanyAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Company {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    taxId: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    currency: string;
    timezone: string;
}

const currencies = [
    { value: "USD", label: "USD — US Dollar" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "GBP", label: "GBP — British Pound" },
    { value: "AED", label: "AED — UAE Dirham" },
    { value: "SAR", label: "SAR — Saudi Riyal" },
    { value: "INR", label: "INR — Indian Rupee" },
    { value: "PKR", label: "PKR — Pakistani Rupee" },
    { value: "CNY", label: "CNY — Chinese Yuan" },
    { value: "JPY", label: "JPY — Japanese Yen" },
    { value: "CAD", label: "CAD — Canadian Dollar" },
    { value: "AUD", label: "AUD — Australian Dollar" },
    { value: "BRL", label: "BRL — Brazilian Real" },
    { value: "EGP", label: "EGP — Egyptian Pound" },
    { value: "TRY", label: "TRY — Turkish Lira" },
    { value: "NGN", label: "NGN — Nigerian Naira" },
];

const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Dubai",
    "Asia/Riyadh",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Africa/Cairo",
    "Africa/Lagos",
];

export function CompanyForm({ company }: { company: Company }) {
    const [state, formAction, isPending] = useActionState(updateCompanyAction, null);

    return (
        <form action={formAction} className="space-y-6">
            {state?.error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {state.error}
                </div>
            )}
            {state?.success && (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                    Company settings updated successfully.
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Basic company details visible to your team.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name *</Label>
                            <Input id="name" name="name" defaultValue={company.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={company.email ?? ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" defaultValue={company.phone ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input id="website" name="website" defaultValue={company.website ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                            <Input id="taxId" name="taxId" defaultValue={company.taxId ?? ""} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Address</CardTitle>
                    <CardDescription>Company address used on invoices and documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="street">Street Address</Label>
                            <Input id="street" name="street" defaultValue={company.street ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" name="city" defaultValue={company.city ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State / Province</Label>
                            <Input id="state" name="state" defaultValue={company.state ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zip">ZIP / Postal Code</Label>
                            <Input id="zip" name="zip" defaultValue={company.zip ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country Code (ISO 2)</Label>
                            <Input
                                id="country"
                                name="country"
                                maxLength={2}
                                placeholder="US"
                                defaultValue={company.country ?? ""}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Localization</CardTitle>
                    <CardDescription>Currency, timezone, and regional preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select name="currency" defaultValue={company.currency}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select name="timezone" defaultValue={company.timezone}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezones.map((tz) => (
                                        <SelectItem key={tz} value={tz}>
                                            {tz}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving…" : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
