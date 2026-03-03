import { getVendorPaymentsAction, getVendorsAction, getVendorBillsAction } from "../actions";
import { VendorPaymentsClient } from "./payments-client";

interface Props {
    searchParams: Promise<{
        page?: string;
        search?: string;
    }>;
}

export default async function VendorPaymentsPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || "1", 10);
    const [{ data, total }, vendors, billsResult] = await Promise.all([
        getVendorPaymentsAction({
            page,
            limit: 25,
            search: params.search,
        }),
        getVendorsAction(),
        getVendorBillsAction({ limit: 500, status: "received" }),
    ]);

    return (
        <VendorPaymentsClient
            payments={data}
            total={total}
            page={page}
            search={params.search ?? ""}
            vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
            bills={billsResult.data.map((b) => ({
                id: b.id,
                number: b.number,
                total: b.total,
                vendorName: b.vendorName,
            }))}
        />
    );
}
