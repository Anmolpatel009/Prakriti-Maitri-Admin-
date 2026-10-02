import ProductForm from "@/components/products/ProductForm";
import {
  getAdminCategories,
  getAdminSubcategories,
} from "@/lib/admin/categories/queries";

export default async function NewProductModalPage() {
  const [categories, subcategories] = await Promise.all([
    getAdminCategories(),
    getAdminSubcategories(),
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-product-modal-title"
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-gray-50 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 id="add-product-modal-title" className="text-xl font-semibold">
              Add Product
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a new product and manage its inventory.
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
          <ProductForm
            categories={categories}
            subcategories={subcategories}
          />
        </div>
      </div>
    </div>
  );
}
