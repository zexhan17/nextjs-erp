import { getGeneralLedgerAction, getAccountsAction } from "../../actions";
import { GeneralLedgerClient } from "./general-ledger-client";

export default async function GeneralLedgerPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const [data, accounts] = await Promise.all([
        getGeneralLedgerAction({
            startDate: params.startDate,
            endDate: params.endDate,
            accountId: params.accountId,
        }),
        getAccountsAction(),
    ]);

    return (
        <GeneralLedgerClient
            data={data}
            accounts={accounts}
            currentStartDate={params.startDate}
            currentEndDate={params.endDate}
            currentAccountId={params.accountId}
        />
    );
}
