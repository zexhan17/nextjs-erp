import { getTaxRatesAction } from "../actions";
import { TaxRatesClient } from "./tax-rates-client";

export default async function TaxRatesPage() {
    const rates = await getTaxRatesAction();

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold">Tax Rates</h2>
                <p className="text-sm text-muted-foreground">
                    Configure tax rates for your transactions.
                </p>
            </div>
            <TaxRatesClient rates={rates} />
        </div>
    );
}
