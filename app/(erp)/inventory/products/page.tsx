import { getProductsAction } from "../actions";
import { ProductsClient } from "./products-client";
import { PageHeader } from "@/components/shared/page-header";

interface Props {
    searchParams: Promise<{
        page?: string;
        search?: string;
        type?: string;
    }>;
}

export default async function ProductsPage({ searchParams }: Props) {
    const params = await searchParams;
    const page = parseInt(params.page || "1", 10);
    const { data, total } = await getProductsAction({
        page,
        limit: 25,
        search: params.search,
        type: params.type,
    });

    return (
        <ProductsClient
            products={data}
            total={total}
            page={page}
            search={params.search ?? ""}
            typeFilter={params.type ?? "all"}
        />
    );
}
