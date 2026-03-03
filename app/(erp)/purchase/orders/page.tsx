import Link from "next/link";
import { getPurchaseOrdersAction } from "../actions";
import { PurchaseOrdersClient } from "./orders-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function PurchaseOrdersPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const page = parseInt(params.page ?? "1", 10);
    const search = params.search ?? "";
    const status = params.status ?? "all";

    const { data, total } = await getPurchaseOrdersAction({ page, search, status });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Purchase Orders</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage purchases from your vendors.
                    </p>
                </div>
                <Link href="/purchase/orders/new">
                    <Button>
                        <Plus className="mr-2 size-4" />
                        New Order
                    </Button>
                </Link>
            </div>
            <PurchaseOrdersClient
                orders={data}
                total={total}
                page={page}
                search={search}
                status={status}
            />
        </div>
    );
}
