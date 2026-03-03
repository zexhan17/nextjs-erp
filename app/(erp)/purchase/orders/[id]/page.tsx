import { notFound } from "next/navigation";
import Link from "next/link";
import { getPurchaseOrderAction } from "../../actions";
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
import { ArrowLeft, Calendar, MapPin, User } from "lucide-react";
import { POStatusActions } from "./po-status-actions";

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    confirmed: "bg-indigo-100 text-indigo-800",
    received: "bg-green-100 text-green-800",
    partially_received: "bg-amber-100 text-amber-800",
    cancelled: "bg-red-100 text-red-800",
};

function fmt(val: string | null | undefined, currency = "USD") {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
    }).format(parseFloat(val ?? "0"));
}

export default async function PurchaseOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const order = await getPurchaseOrderAction(id);
    if (!order) notFound();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/purchase/orders">
                        <Button variant="ghost" size="icon" className="size-8">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{order.number}</h1>
                            <Badge className={statusColors[order.status] ?? ""}>
                                {order.status.replace("_", " ")}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Created {new Date(order.createdAt!).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <POStatusActions orderId={order.id} currentStatus={order.status} />
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
                                        <p className="font-medium">{order.vendorName}</p>
                                        {order.vendorEmail && (
                                            <p className="text-sm text-muted-foreground">{order.vendorEmail}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 size-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Order Date</p>
                                        <p className="font-medium">
                                            {new Date(order.orderDate!).toLocaleDateString()}
                                        </p>
                                        {order.expectedDate && (
                                            <p className="text-sm text-muted-foreground">
                                                Expected: {new Date(order.expectedDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {order.shippingAddress && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">Delivery</p>
                                            <p className="font-medium">{order.shippingAddress}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Line Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Disc %</TableHead>
                                        <TableHead className="text-right">Tax %</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.lines.map((line, idx) => (
                                        <TableRow key={line.id}>
                                            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                            <TableCell className="font-medium">{line.description}</TableCell>
                                            <TableCell className="text-right">{line.quantity}</TableCell>
                                            <TableCell className="text-right">
                                                {fmt(line.unitPrice, order.currency ?? "USD")}
                                            </TableCell>
                                            <TableCell className="text-right">{line.discount ?? "0"}%</TableCell>
                                            <TableCell className="text-right">{line.taxRate ?? "0"}%</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {fmt(line.lineTotal, order.currency ?? "USD")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Separator className="my-4" />

                            <div className="flex flex-col items-end gap-1 text-sm">
                                <div className="flex gap-12">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{fmt(order.subtotal, order.currency ?? "USD")}</span>
                                </div>
                                <div className="flex gap-12">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{fmt(order.taxAmount, order.currency ?? "USD")}</span>
                                </div>
                                <Separator className="my-1 w-48" />
                                <div className="flex gap-12 text-base font-bold">
                                    <span>Total</span>
                                    <span>{fmt(order.total, order.currency ?? "USD")}</span>
                                </div>
                                {parseFloat(order.amountPaid ?? "0") > 0 && (
                                    <div className="flex gap-12 text-green-600">
                                        <span>Paid</span>
                                        <span>{fmt(order.amountPaid, order.currency ?? "USD")}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Number</span>
                                <span className="font-mono">{order.number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant="outline" className={statusColors[order.status] ?? ""}>
                                    {order.status.replace("_", " ")}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Currency</span>
                                <span>{order.currency}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Items</span>
                                <span>{order.lines.length}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium">
                                <span>Total</span>
                                <span>{fmt(order.total, order.currency ?? "USD")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Balance Due</span>
                                <span className="font-medium">
                                    {fmt(
                                        String(parseFloat(order.total ?? "0") - parseFloat(order.amountPaid ?? "0")),
                                        order.currency ?? "USD"
                                    )}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {(order.notes || order.terms) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Notes & Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {order.notes && (
                                    <div>
                                        <p className="font-medium text-muted-foreground mb-1">Internal Notes</p>
                                        <p className="whitespace-pre-line">{order.notes}</p>
                                    </div>
                                )}
                                {order.terms && (
                                    <div>
                                        <p className="font-medium text-muted-foreground mb-1">Terms & Conditions</p>
                                        <p className="whitespace-pre-line">{order.terms}</p>
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
