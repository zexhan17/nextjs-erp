import { getFiscalYearsAction } from "../actions";
import { FiscalYearsClient } from "./fiscal-years-client";

export default async function FiscalYearsPage() {
    const years = await getFiscalYearsAction();

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold">Fiscal Years</h2>
                <p className="text-sm text-muted-foreground">
                    Define your company's fiscal periods.
                </p>
            </div>
            <FiscalYearsClient years={years} />
        </div>
    );
}
