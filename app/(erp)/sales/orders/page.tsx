import { getSalesOrdersAction } from "../actions";
import { OrdersClient } from "./orders-client";

interface Props {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
    }>;
}

export default async function SalesOrdersPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || "1", 10);
    const { data, total } = await getSalesOrdersAction({
        page,
        limit: 25,
        search: params.search,
        status: params.status,
    });

    return (
        <OrdersClient
            orders={data}
            total={total}
            page={page}
            search={params.search ?? ""}
            statusFilter={params.status ?? "all"}
        />
    );
}
