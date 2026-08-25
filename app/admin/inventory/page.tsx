import Link from "next/link";
import { getAdminInventory } from "@/lib/admin/inventory/queries";

export default async function InventoryPage() {
  const inventory = await getAdminInventory();

  const lowStockCount = inventory.filter(
    (item) => item.is_low_stock
  ).length;

  const totalAvailableUnits = inventory.reduce(
    (total, item) => total + item.available_stock,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor stock levels and inventory status.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Products
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {inventory.length}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Low Stock
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {lowStockCount}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Available Units
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {totalAvailableUnits}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Stock Overview
          </h2>
        </div>

        {inventory.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No inventory records found.
          </div>
        ) : (
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
                    Stock
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Reserved
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Available
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Threshold
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
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {item.product?.name ??
                            "Unknown Product"}
                        </p>

                        {!item.product?.is_active && (
                          <span className="text-xs text-gray-500">
                            Inactive product
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.product?.sku ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4">
                      {item.reserved_quantity}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {item.available_stock}
                    </td>

                    <td className="px-5 py-4">
                      {item.low_stock_threshold}
                    </td>

                    <td className="px-5 py-4">
                      {item.is_low_stock ? (
                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          In Stock
                        </span>
                      )}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}