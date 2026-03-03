import { getCustomersAction } from "../../actions";
import { OrderForm } from "../order-form";

export default async function NewSalesOrderPage() {
    const customers = await getCustomersAction();
    return <OrderForm customers={customers} />;
}
