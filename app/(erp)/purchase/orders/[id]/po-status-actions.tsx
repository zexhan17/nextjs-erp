"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePurchaseOrderStatusAction, deletePurchaseOrderAction } from "../../actions";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

const transitions: Record<string, { label: string; next: string }[]> = {
    draft: [{ label: "Send to Vendor", next: "sent" }],
    sent: [
        { label: "Mark Confirmed", next: "confirmed" },
        { label: "Cancel Order", next: "cancelled" },
    ],
    confirmed: [
        { label: "Mark Partially Received", next: "partially_received" },
        { label: "Mark Received", next: "received" },
        { label: "Cancel Order", next: "cancelled" },
    ],
    partially_received: [{ label: "Mark Fully Received", next: "received" }],
    received: [],
    cancelled: [],
};

export function POStatusActions({
    orderId,
    currentStatus,
}: {
    orderId: string;
    currentStatus: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const available = transitions[currentStatus] ?? [];

    async function handleStatusChange(status: string) {
        startTransition(async () => {
            const res = await updatePurchaseOrderStatusAction(orderId, status);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Status updated");
                router.refresh();
            }
        });
    }

    async function handleDelete() {
        if (!confirm("Delete this draft order?")) return;
        startTransition(async () => {
            const res = await deletePurchaseOrderAction(orderId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Order deleted");
                router.push("/purchase/orders");
            }
        });
    }

    if (available.length === 0 && currentStatus !== "draft") return null;

    return (
        <div className="flex items-center gap-2">
            {available.length === 1 ? (
                <Button onClick={() => handleStatusChange(available[0].next)} disabled={isPending}>
                    {available[0].label}
                </Button>
            ) : available.length > 1 ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={isPending}>
                            Actions <ChevronDown className="ml-2 size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {available.map((a) => (
                            <DropdownMenuItem key={a.next} onClick={() => handleStatusChange(a.next)}>
                                {a.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}

            {currentStatus === "draft" && (
                <Button variant="outline" size="icon" onClick={handleDelete} disabled={isPending}>
                    <Trash2 className="size-4" />
                </Button>
            )}
        </div>
    );
}
