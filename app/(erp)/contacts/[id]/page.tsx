import { getContactAction } from "../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import {
    ArrowLeft,
    Pencil,
    Mail,
    Phone,
    Globe,
    MapPin,
    Building2,
    User,
    Briefcase,
} from "lucide-react";

interface Props {
    params: Promise<{ id: string }>;
}

const typeLabel: Record<string, string> = {
    customer: "Customer",
    vendor: "Vendor",
    customer_vendor: "Customer & Vendor",
    employee: "Employee",
    other: "Other",
};

export default async function ContactDetailPage({ params }: Props) {
    const { id } = await params;
    const contact = await getContactAction(id);
    if (!contact) notFound();

    const initials = contact.isOrganization
        ? null
        : contact.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const addressParts = [
        contact.street,
        contact.city,
        contact.state,
        contact.zip,
        contact.country,
    ].filter(Boolean);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/contacts">
                        <Button variant="ghost" size="icon" className="size-8">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <Avatar className="size-12">
                        <AvatarFallback className="text-base">
                            {contact.isOrganization ? (
                                <Building2 className="size-5" />
                            ) : (
                                initials
                            )}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold">{contact.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs capitalize">
                                {typeLabel[contact.type] ?? contact.type}
                            </Badge>
                            {contact.isOrganization && (
                                <Badge variant="secondary" className="text-xs">
                                    Organization
                                </Badge>
                            )}
                            <Badge
                                variant={contact.isActive ? "default" : "secondary"}
                                className="text-xs"
                            >
                                {contact.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>
                </div>
                <Link href={`/contacts/${id}/edit`}>
                    <Button variant="outline" size="sm">
                        <Pencil className="mr-2 size-4" />
                        Edit
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {contact.email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="size-4 text-muted-foreground" />
                                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                        {contact.email}
                                    </a>
                                </div>
                            )}
                            {contact.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="size-4 text-muted-foreground" />
                                    <a href={`tel:${contact.phone}`} className="hover:underline">
                                        {contact.phone}
                                    </a>
                                </div>
                            )}
                            {contact.mobile && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="size-4 text-muted-foreground" />
                                    <a href={`tel:${contact.mobile}`} className="hover:underline">
                                        {contact.mobile} (mobile)
                                    </a>
                                </div>
                            )}
                            {contact.website && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Globe className="size-4 text-muted-foreground" />
                                    <a
                                        href={contact.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {contact.website}
                                    </a>
                                </div>
                            )}
                            {addressParts.length > 0 && (
                                <div className="flex items-start gap-3 text-sm">
                                    <MapPin className="size-4 text-muted-foreground mt-0.5" />
                                    <span>{addressParts.join(", ")}</span>
                                </div>
                            )}
                            {!contact.email && !contact.phone && !contact.website && addressParts.length === 0 && (
                                <p className="text-sm text-muted-foreground">No contact details yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {(contact.jobTitle || contact.department) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Position</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {contact.jobTitle && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Briefcase className="size-4 text-muted-foreground" />
                                        {contact.jobTitle}
                                    </div>
                                )}
                                {contact.department && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Building2 className="size-4 text-muted-foreground" />
                                        {contact.department}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {contact.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {contact.taxId && (
                                <div>
                                    <span className="text-muted-foreground">Tax ID:</span>{" "}
                                    {contact.taxId}
                                </div>
                            )}
                            {contact.currency && (
                                <div>
                                    <span className="text-muted-foreground">Currency:</span>{" "}
                                    {contact.currency}
                                </div>
                            )}
                            {contact.paymentTermDays && (
                                <div>
                                    <span className="text-muted-foreground">Payment Terms:</span>{" "}
                                    Net {contact.paymentTermDays} days
                                </div>
                            )}
                            <Separator />
                            <div>
                                <span className="text-muted-foreground">Created:</span>{" "}
                                {new Date(contact.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                                <span className="text-muted-foreground">Updated:</span>{" "}
                                {new Date(contact.updatedAt).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder cards for future: transactions, activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Sales orders, invoices, and interactions will appear here once those modules are built.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
