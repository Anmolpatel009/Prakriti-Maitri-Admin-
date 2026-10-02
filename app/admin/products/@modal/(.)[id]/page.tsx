import { notFound } from "next/navigation";
import ProductEditForm from "@/components/products/ProductEditForm";
import {
  getAdminCategories,
  getAdminSubcategories,
} from "@/lib/admin/categories/queries";
import { getAdminProduct } from "@/lib/admin/products/queries";

export default async function EditProductModalPage({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-modal-title"
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-gray-50 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 id="edit-product-modal-title" className="text-xl font-semibold">
              Edit Product
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update product details, inventory and MOQ.
            </p>
          </div>

          <a
            href="/admin/products"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </a>
        </div>

        <div className="overflow-y-auto p-6">
          <ProductEditForm
            product={{
              id: product.id,
              category_id: product.category_id,
              subcategory_id: product.subcategory_id,
              name: product.name,
              slug: product.slug,
              description: product.description,
              price: product.price,
              compare_at_price: product.compare_at_price,
              sku: product.sku,
              short_description: product.short_description,
              is_active: product.is_active,
              quantity: inventory?.quantity ?? 0,
              reservedQuantity: inventory?.reserved_quantity ?? 0,
              minimum_order_quantity:
                product.minimum_order_quantity ?? 1,
              images: product.product_images ?? [],
            }}
            categories={categories}
            subcategories={subcategories}
          />
        </div>
      </div>
    </div>
  );
}
