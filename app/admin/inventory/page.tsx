import Link from "next/link";
import { getAdminInventory } from "@/lib/admin/inventory/queries";

export default async function InventoryPage() {
  const inventory = await getAdminInventory();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Inventory</h2>

        <p className="mt-1 text-sm text-gray-500">
          Monitor stock levels and manage inventory adjustments.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>

                <th className="px-5 py-3 font-medium">SKU</th>

                <th className="px-5 py-3 font-medium">Stock</th>

                <th className="px-5 py-3 font-medium">
                  Reserved
                </th>

                <th className="px-5 py-3 font-medium">
                  Available
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
              {inventory.map((item) => {
                const product = Array.isArray(item.products)
                  ? item.products[0]
                  : item.products;

                const available = Math.max(
                  item.quantity - item.reserved_quantity,
                  0
                );

                let status = "In Stock";

                if (available === 0) {
                  status = "Out of Stock";
                } else if (available <= 5) {
                  status = "Low Stock";
                }

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium">
                      {product?.name ?? "Unknown product"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {product?.sku || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4">
                      {item.reserved_quantity}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {available}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                        {status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/inventory/${item.product_id}`}
                        className="font-medium underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {inventory.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No inventory records found.
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