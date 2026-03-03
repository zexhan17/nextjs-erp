import { getCategoriesAction } from "../actions";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
    const categories = await getCategoriesAction();
    return <CategoriesClient categories={categories} />;
}
