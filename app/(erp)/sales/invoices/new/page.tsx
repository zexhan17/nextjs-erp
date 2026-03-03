import { getCustomersAction } from "../../actions";
import { InvoiceForm } from "./invoice-form";

export default async function NewInvoicePage() {
    const customers = await getCustomersAction();
    return <InvoiceForm customers={customers} />;
}
