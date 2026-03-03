import { getCustomersAction } from "../../actions";
import { QuotationForm } from "./quotation-form";

export default async function NewQuotationPage() {
    const customers = await getCustomersAction();
    return <QuotationForm customers={customers} />;
}
