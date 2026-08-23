import Link from "next/link";
import { getAdminProducts } from "@/lib/admin/products/queries";

export default async function ProductsPage() {
  const products = await getAdminProducts();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage products, pricing, status and inventory.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Add Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {products.map((product) => {
                const inventory = Array.isArray(product.inventory)
                  ? product.inventory[0]
                  : product.inventory;

                const quantity = inventory?.quantity ?? 0;
                const reserved = inventory?.reserved_quantity ?? 0;
                const available = Math.max(quantity - reserved, 0);

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        {product.slug}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {product.sku || "—"}
                    </td>

                    <td className="px-5 py-4">
                      ₹{Number(product.price).toLocaleString("en-IN")}
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
                        {product.is_active ? "Active" : "Inactive"}
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
    </div>
  );
}
