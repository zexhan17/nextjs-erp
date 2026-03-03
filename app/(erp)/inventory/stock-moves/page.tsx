import { getStockMovesAction, getProductsAction, getWarehousesAction } from "../actions";
import { StockMovesClient } from "./stock-moves-client";

interface Props {
    searchParams: Promise<{
        page?: string;
        search?: string;
        type?: string;
    }>;
}

export default async function StockMovesPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || "1", 10);
    const [{ data, total }, productsResult, warehouses] = await Promise.all([
        getStockMovesAction({
            page,
            limit: 25,
            search: params.search,
            type: params.type,
        }),
        getProductsAction({ limit: 1000 }),
        getWarehousesAction(),
    ]);

    return (
        <StockMovesClient
            moves={data}
            total={total}
            page={page}
            search={params.search ?? ""}
            typeFilter={params.type ?? "all"}
            products={productsResult.data.map(p => ({ id: p.id, name: p.name, sku: p.sku }))}
            warehouses={warehouses.map(w => ({ id: w.id, name: w.name }))}
        />
    );
}
