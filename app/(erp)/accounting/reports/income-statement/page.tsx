import { getIncomeStatementAction, getFiscalYearsAction } from "../../actions";
import { IncomeStatementClient } from "./income-statement-client";

export default async function IncomeStatementPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const [data, fiscalYears] = await Promise.all([
        getIncomeStatementAction({
            startDate: params.startDate,
            endDate: params.endDate,
            fiscalYearId: params.fiscalYearId,
        }),
        getFiscalYearsAction(),
    ]);

    return (
        <IncomeStatementClient
            data={data}
            fiscalYears={fiscalYears}
            currentStartDate={params.startDate}
            currentEndDate={params.endDate}
            currentFiscalYearId={params.fiscalYearId}
        />
    );
}
