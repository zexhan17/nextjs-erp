import { getAccountingBillsAction } from "../actions";
import { BillsClient } from "./bills-client";

interface Props {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
    }>;
}

export default async function AccountingBillsPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || "1", 10);
    const { data, total } = await getAccountingBillsAction({
        page,
        limit: 25,
        search: params.search,
        status: params.status,
    });

    return (
        <BillsClient
            bills={data}
            total={total}
            page={page}
            search={params.search ?? ""}
            statusFilter={params.status ?? "all"}
        />
    );
}
