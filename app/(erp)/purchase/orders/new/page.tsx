import { getVendorsAction } from "../../actions";
import { PurchaseOrderForm } from "./order-form";

export default async function NewPurchaseOrderPage() {
    const vendors = await getVendorsAction();

    return <PurchaseOrderForm vendors={vendors} />;
}
