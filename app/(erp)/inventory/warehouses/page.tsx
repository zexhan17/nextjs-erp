import { getWarehousesAction } from "../actions";
import { WarehousesClient } from "./warehouses-client";

export default async function WarehousesPage() {
    const warehouses = await getWarehousesAction();
    return <WarehousesClient warehouses={warehouses} />;
}
