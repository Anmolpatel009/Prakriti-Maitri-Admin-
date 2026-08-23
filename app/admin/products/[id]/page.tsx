import { notFound } from "next/navigation";
import {
  getAdminCategories,
  getAdminProduct,
  getAdminSubcategories,
} from "@/lib/admin/products/queries";
import ProductEditForm from "@/components/products/ProductEditForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, subcategories] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
    getAdminSubcategories(),
  ]);

  if (!product) {
    notFound();
  }

  const inventory = Array.isArray(product.inventory)
    ? product.inventory[0]
    : product.inventory;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Edit Product</h2>
        <p className="mt-1 text-sm text-gray-500">
          Update product information and stock.
        </p>
      </div>

      <ProductEditForm
        product={{
          ...product,
          quantity: inventory?.quantity ?? 0,
          reservedQuantity: inventory?.reserved_quantity ?? 0,
        }}
        categories={categories}
        subcategories={subcategories}
      />
    </div>
  );
}
