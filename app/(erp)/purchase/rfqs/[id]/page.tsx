import { notFound } from "next/navigation";
import Link from "next/link";
import { getRFQAction } from "../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { RFQStatusActions } from "./rfq-status-actions";

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    quoted: "bg-purple-100 text-purple-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-amber-100 text-amber-800",
};

function fmt(val: string | null | undefined, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
    }).format(parseFloat(val ?? "0"));
}

export default async function RFQDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const rfq = await getRFQAction(id);
    if (!rfq) notFound();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/purchase/rfqs">
                        <Button variant="ghost" size="icon" className="size-8">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{rfq.number}</h1>
                            <Badge className={statusColors[rfq.status] ?? ""}>
                                {rfq.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Created {new Date(rfq.createdAt!).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <RFQStatusActions rfqId={rfq.id} currentStatus={rfq.status} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="flex items-start gap-3">
                                    <User className="mt-0.5 size-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Vendor</p>
                                        <p className="font-medium">{rfq.vendorName}</p>
                                        {rfq.vendorEmail && (
                                            <p className="text-sm text-muted-foreground">{rfq.vendorEmail}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 size-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">RFQ Date</p>
                                        <p className="font-medium">
                                            {new Date(rfq.date).toLocaleDateString()}
                                        </p>
                                        {rfq.validUntil && (
                                            <p className="text-sm text-muted-foreground">
                                                Valid Until: {new Date(rfq.validUntil).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Requested Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Disc %</TableHead>
                                        <TableHead className="text-right">Tax %</TableHead>
                                        {rfq.status === "quoted" && (
                                            <TableHead className="text-right">Unit Price</TableHead>
                                        )}
                                        {rfq.status === "quoted" && (
                                            <TableHead className="text-right">Total</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rfq.lines.map((line, idx) => (
                                        <TableRow key={line.id}>
                                            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                            <TableCell className="font-medium">{line.description}</TableCell>
                                            <TableCell className="text-right">{line.quantity}</TableCell>
                                            <TableCell className="text-right">{line.discount ?? "0"}%</TableCell>
                                            <TableCell className="text-right">{line.taxRate ?? "0"}%</TableCell>
                                            {rfq.status === "quoted" && (
                                                <TableCell className="text-right">
                                                    {fmt(line.unitPrice, rfq.currency ?? "USD")}
                                                </TableCell>
                                            )}
                                            {rfq.status === "quoted" && (
                                                <TableCell className="text-right font-medium">
                                                    {fmt(line.lineTotal, rfq.currency ?? "USD")}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {rfq.status === "quoted" && (
                                <>
                                    <Separator className="my-4" />

                                    <div className="flex flex-col items-end gap-1 text-sm">
                                        <div className="flex gap-12">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{fmt(rfq.subtotal, rfq.currency ?? "USD")}</span>
                                        </div>
                                        <div className="flex gap-12">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span>{fmt(rfq.taxAmount, rfq.currency ?? "USD")}</span>
                                        </div>
                                        <Separator className="my-1 w-48" />
                                        <div className="flex gap-12 text-base font-bold">
                                            <span>Total</span>
                                            <span>{fmt(rfq.total, rfq.currency ?? "USD")}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">RFQ Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Number</span>
                                <span className="font-mono">{rfq.number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant="outline" className={statusColors[rfq.status] ?? ""}>
                                    {rfq.status}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Currency</span>
                                <span>{rfq.currency}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Items Requested</span>
                                <span>{rfq.lines.length}</span>
                            </div>
                            {rfq.status === "quoted" && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between font-medium">
                                        <span>Quoted Total</span>
                                        <span>{fmt(rfq.total, rfq.currency ?? "USD")}</span>
                                    </div>
                                </>
                            )}
                            {rfq.purchaseOrderId && (
                                <div className="mt-4 pt-4 border-t">
                                    <div className="text-xs text-green-600 font-medium mb-2">✓ Converted to PO</div>
                                    <Link href={`/purchase/orders/${rfq.purchaseOrderId}`}>
                                        <Button variant="outline" size="sm" className="w-full">
                                            View Purchase Order
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {(rfq.notes || rfq.terms) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Notes & Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {rfq.notes && (
                                    <div>
                                        <p className="font-medium text-muted-foreground mb-1">Notes</p>
                                        <p className="whitespace-pre-line">{rfq.notes}</p>
                                    </div>
                                )}
                                {rfq.terms && (
                                    <div>
                                        <p className="font-medium text-muted-foreground mb-1">Delivery Terms</p>
                                        <p className="whitespace-pre-line">{rfq.terms}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
