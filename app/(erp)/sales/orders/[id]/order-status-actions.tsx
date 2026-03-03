"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSalesOrderStatusAction, deleteSalesOrderAction } from "../../actions";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

const transitions: Record<string, { label: string; next: string }[]> = {
    draft: [{ label: "Confirm Order", next: "confirmed" }],
    confirmed: [
        { label: "Start Processing", next: "processing" },
        { label: "Cancel Order", next: "cancelled" },
    ],
    processing: [
        { label: "Mark as Shipped", next: "shipped" },
        { label: "Cancel Order", next: "cancelled" },
    ],
    shipped: [{ label: "Mark as Delivered", next: "delivered" }],
    delivered: [],
    cancelled: [],
};

export function OrderStatusActions({
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
            const res = await updateSalesOrderStatusAction(orderId, status);
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
            const res = await deleteSalesOrderAction(orderId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Order deleted");
                router.push("/sales/orders");
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
