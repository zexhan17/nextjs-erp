import { getBalanceSheetAction } from "../../actions";
import { BalanceSheetClient } from "./balance-sheet-client";

export default async function BalanceSheetPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const params = await searchParams;
    const data = await getBalanceSheetAction({ date: params.date });

    return <BalanceSheetClient data={data} currentDate={params.date} />;
}
