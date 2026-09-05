import Link from "next/link";
import { getAdminProducts } from "@/lib/admin/products/queries";
import {
  getAdminCategories,
  getAdminSubcategories,
} from "@/lib/admin/categories/queries";

export default async function ProductsPage() {
  const [products, categories, subcategories] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
    getAdminSubcategories(),
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage products, categories, pricing, status and inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories/new"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Add Category
          </Link>

          <Link
            href="/admin/products/new"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Categories & Subcategories */}
      <section className="mb-8 rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="font-semibold">Categories & Subcategories</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage the categories and subcategories used by your products.
            </p>
          </div>

          <Link
            href="/admin/categories"
            className="text-sm font-medium text-gray-700 underline hover:text-black"
          >
            Manage All
          </Link>
        </div>

        <div className="divide-y">
          {categories.map((category) => {
            const categorySubcategories = subcategories.filter(
              (subcategory) =>
                subcategory.category_id === category.id
            );

            return (
              <div key={category.id} className="px-6 py-5">
                {/* Category */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">
                        {category.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        /{category.slug}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        category.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Link
                      href={`/admin/categories/${category.id}/subcategories/new`}
                      className="text-sm font-medium text-gray-700 underline hover:text-black"
                    >
                      + Add Subcategory
                    </Link>

                    <Link
                      href={`/admin/categories/${category.id}`}
                      className="text-sm font-medium underline"
                    >
                      Manage
                    </Link>
                  </div>
                </div>

                {/* Subcategories */}
                <div className="mt-4 ml-4 border-l pl-5">
                  {categorySubcategories.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No subcategories.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categorySubcategories.map((subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {subcategory.name}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              /{subcategory.slug}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                subcategory.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {subcategory.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>

                            <Link
                           href={`/admin/categories/${category.id}/subcategories/${subcategory.id}`}
                              className="text-sm font-medium underline"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {categories.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-500">
                No categories found.
              </p>

              <Link
                href="/admin/categories/new"
                className="mt-3 inline-block text-sm font-medium underline"
              >
                + Add your first category
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Products */}
      <section>
        <div className="mb-4">
          <h3 className="font-semibold">Products</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage product pricing, inventory and status.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium">
                    SKU
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Price
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Stock
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {products.map((product) => {
                  const inventory = Array.isArray(product.inventory)
                    ? product.inventory[0]
                    : product.inventory;

                  const quantity = inventory?.quantity ?? 0;
                  const reserved =
                    inventory?.reserved_quantity ?? 0;

                  const available = Math.max(
                    quantity - reserved,
                    0
                  );

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {product.name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {product.slug}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {product.sku || "—"}
                      </td>

                      <td className="px-5 py-4">
                        ₹
                        {Number(product.price).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div>{available}</div>

                        {reserved > 0 && (
                          <div className="text-xs text-gray-500">
                            {reserved} reserved
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            product.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}