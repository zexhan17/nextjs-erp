import { notFound } from "next/navigation";
import Link from "next/link";
import { getJournalEntryAction } from "../../actions";
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
import { ArrowLeft } from "lucide-react";
import { JEStatusActions } from "./je-status-actions";

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    posted: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

function fmt(val: string | null) {
    return parseFloat(val ?? "0").toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default async function JournalEntryDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const entry = await getJournalEntryAction(id);
    if (!entry) notFound();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/journal">
                        <Button variant="ghost" size="icon" className="size-8">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{entry.number}</h1>
                            <Badge className={statusColors[entry.status] ?? ""}>
                                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                            {entry.reference && ` · Ref: ${entry.reference}`}
                        </p>
                    </div>
                </div>
                <JEStatusActions entryId={entry.id} currentStatus={entry.status} />
            </div>

            {entry.description && (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm">{entry.description}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Lines</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entry.lines.map((line, idx) => (
                                <TableRow key={line.id}>
                                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                    <TableCell className="font-medium">
                                        <span className="font-mono text-xs mr-2">{line.accountCode}</span>
                                        {line.accountName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{line.description || "—"}</TableCell>
                                    <TableCell className="text-right font-medium">{fmt(line.debit)}</TableCell>
                                    <TableCell className="text-right font-medium">{fmt(line.credit)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Separator className="my-4" />

                    <div className="flex flex-col items-end gap-1 text-sm">
                        <div className="flex gap-12 font-bold">
                            <span>Total Debit</span>
                            <span>{fmt(entry.totalDebit)}</span>
                        </div>
                        <div className="flex gap-12 font-bold">
                            <span>Total Credit</span>
                            <span>{fmt(entry.totalCredit)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
