"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRFQStatusAction, deleteRFQAction, createPurchaseOrderFromRFQAction } from "../../actions";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const transitions: Record<string, { label: string; next: string }[]> = {
    draft: [{ label: "Send to Vendor", next: "sent" }],
    sent: [
        { label: "Mark Quoted", next: "quoted" },
        { label: "Reject", next: "rejected" },
        { label: "Mark Expired", next: "expired" },
    ],
    quoted: [
        { label: "Accept Quote", next: "accepted" },
        { label: "Reject", next: "rejected" },
        { label: "Mark Expired", next: "expired" },
    ],
    accepted: [],
    rejected: [],
    expired: [],
};

export function RFQStatusActions({
    rfqId,
    currentStatus,
}: {
    rfqId: string;
    currentStatus: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const available = transitions[currentStatus] ?? [];

    async function handleStatusChange(status: string) {
        startTransition(async () => {
            const res = await updateRFQStatusAction(rfqId, status);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Status updated");
                router.refresh();
            }
        });
    }

    async function handleDelete() {
        if (!confirm("Delete this draft RFQ? This cannot be undone.")) return;
        startTransition(async () => {
            const res = await deleteRFQAction(rfqId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("RFQ deleted");
                router.push("/purchase/rfqs");
            }
        });
    }

    async function handleConvertToPO() {
        if (!confirm("Convert this accepted RFQ to a Purchase Order?")) return;
        startTransition(async () => {
            const res = await createPurchaseOrderFromRFQAction(rfqId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Purchase Order created");
                router.push(`/purchase/orders/${res.poId}`);
            }
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isPending && available.length === 0 && currentStatus !== "accepted"}>
                    <ChevronDown className="mr-2 size-4" />
                    Actions
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {available.map((action) => (
                    <DropdownMenuItem
                        key={action.next}
                        onClick={() => handleStatusChange(action.next)}
                        disabled={isPending}
                    >
                        {action.label}
                    </DropdownMenuItem>
                ))}

                {currentStatus === "accepted" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleConvertToPO} disabled={isPending}>
                            <ShoppingCart className="mr-2 size-4" />
                            Create Purchase Order
                        </DropdownMenuItem>
                    </>
                )}

                {currentStatus === "draft" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleDelete}
                            disabled={isPending}
                            className="text-destructive"
                        >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
