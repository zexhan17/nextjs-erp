import { getVendorsAction } from "../../actions";
import { BillForm } from "./bill-form";

export default async function NewBillPage() {
    const vendors = await getVendorsAction();
    return <BillForm vendors={vendors} />;
}
