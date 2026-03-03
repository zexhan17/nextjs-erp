import Link from "next/link";
import { getRFQsAction } from "../actions";
import { RFQsClient } from "./rfqs-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function RFQsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const page = parseInt(params.page ?? "1", 10);
    const search = params.search ?? "";
    const status = params.status ?? "all";

    const { data, total } = await getRFQsAction({ page, search, status });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Requests for Quotation</h2>
                    <p className="text-sm text-muted-foreground">
                        Request quotes from your vendors before creating purchase orders.
                    </p>
                </div>
                <Link href="/purchase/rfqs/new">
                    <Button>
                        <Plus className="mr-2 size-4" />
                        New RFQ
                    </Button>
                </Link>
            </div>
            <RFQsClient
                rfqs={data}
                total={total}
                page={page}
                search={search}
                status={status}
            />
        </div>
    );
}
