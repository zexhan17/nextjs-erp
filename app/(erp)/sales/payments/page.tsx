import { getPaymentsAction, getCustomersAction, getInvoicesAction } from "../actions";
import { PaymentsClient } from "./payments-client";

interface Props {
    searchParams: Promise<{
        page?: string;
        search?: string;
        method?: string;
    }>;
}

export default async function PaymentsPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || "1", 10);
    const [{ data, total }, customers, invoicesResult] = await Promise.all([
        getPaymentsAction({
            page,
            limit: 25,
            search: params.search,
            method: params.method,
        }),
        getCustomersAction(),
        getInvoicesAction({ limit: 500, status: "sent" }),
    ]);

    return (
        <PaymentsClient
            payments={data}
            total={total}
            page={page}
            search={params.search ?? ""}
            methodFilter={params.method ?? "all"}
            customers={customers.map((c) => ({ id: c.id, name: c.name }))}
            invoices={invoicesResult.data.map((inv) => ({
                id: inv.id,
                number: inv.number,
                balanceDue: inv.balanceDue,
                customerName: inv.customerName,
            }))}
        />
    );
}
