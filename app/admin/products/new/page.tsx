import { getAdminProduct, getAdminCategories, getAdminSubcategories } from "@/lib/admin/products/queries";
import ProductForm from "@/components/products/ProductForm";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ clone?: string }>;
}) {
  const params = await searchParams;

  const cloneProduct = params.clone
    ? await getAdminProduct(params.clone)
    : null;

  const [categories, subcategories] = await Promise.all([
    getAdminCategories(),
    getAdminSubcategories(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Add Product</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add a new product to the Prakriti Maitri store.
        </p>
      </div>

      <ProductForm
        categories={categories}
        subcategories={subcategories}
        cloneProduct={cloneProduct}
      />
    </div>
  );
}
