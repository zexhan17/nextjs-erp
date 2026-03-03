import { getAccountingPaymentsAction } from "../actions";
import { PaymentsClient } from "./payments-client";

interface Props {
    searchParams: Promise<{
        search?: string;
        type?: string;
    }>;
}

export default async function AccountingPaymentsPage({ searchParams }: Props) {
    const params = await searchParams;
    const { incoming, outgoing } = await getAccountingPaymentsAction({
        search: params.search,
        type: params.type,
    });

    return (
        <PaymentsClient
            incoming={incoming}
            outgoing={outgoing}
            search={params.search ?? ""}
            typeFilter={params.type ?? "all"}
        />
    );
}
