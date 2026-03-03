import { getProductAction } from "../../../actions";
import { ProductForm } from "../../product-form";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
    const { id } = await params;
    const product = await getProductAction(id);
    if (!product) notFound();

    return <ProductForm product={product} />;
}
