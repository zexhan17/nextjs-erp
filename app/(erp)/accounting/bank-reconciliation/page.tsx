import { getBankReconciliationAction } from "../actions";
import { BankReconciliationClient } from "./reconciliation-client";

interface Props {
    searchParams: Promise<{
        accountId?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function BankReconciliationPage({ searchParams }: Props) {
    const params = await searchParams;
    const data = await getBankReconciliationAction({
        accountId: params.accountId,
        startDate: params.startDate,
        endDate: params.endDate,
    });

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No active company selected.</p>
            </div>
        );
    }

    return (
        <BankReconciliationClient
            bankAccounts={data.bankAccounts}
            selectedAccount={data.selectedAccount}
            transactions={data.transactions}
            summary={data.summary}
            startDate={params.startDate ?? ""}
            endDate={params.endDate ?? ""}
        />
    );
}
