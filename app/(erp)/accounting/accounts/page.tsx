import { getAccountsAction } from "../actions";
import { AccountsClient } from "./accounts-client";

export default async function ChartOfAccountsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const accounts = await getAccountsAction({
        search: params.search,
        type: params.type,
    });

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold">Chart of Accounts</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your company's account structure.
                </p>
            </div>
            <AccountsClient accounts={accounts} />
        </div>
    );
}
