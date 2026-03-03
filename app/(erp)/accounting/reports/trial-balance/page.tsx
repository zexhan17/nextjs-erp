import { getTrialBalanceAction, getFiscalYearsAction } from "../../actions";
import { TrialBalanceClient } from "./trial-balance-client";

export default async function TrialBalancePage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const [data, fiscalYears] = await Promise.all([
        getTrialBalanceAction({
            date: params.date,
            fiscalYearId: params.fiscalYearId,
        }),
        getFiscalYearsAction(),
    ]);

    return (
        <TrialBalanceClient
            data={data}
            fiscalYears={fiscalYears}
            currentDate={params.date}
            currentFiscalYearId={params.fiscalYearId}
        />
    );
}
