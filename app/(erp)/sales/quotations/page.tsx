import { getQuotationsAction } from "../actions";
import { QuotationsClient } from "./quotations-client";

interface Props {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
    }>;
}

export default async function QuotationsPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || "1", 10);
    const { data, total } = await getQuotationsAction({
        page,
        limit: 25,
        search: params.search,
        status: params.status,
    });

    return (
        <QuotationsClient
            quotations={data}
            total={total}
            page={page}
            search={params.search ?? ""}
            statusFilter={params.status ?? "all"}
        />
    );
}
