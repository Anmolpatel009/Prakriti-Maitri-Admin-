import { notFound } from "next/navigation";

import InventoryAdjustmentForm from "@/components/inventory/InventoryAdjustmentForm";
import InventoryThresholdForm from "@/components/inventory/InventoryThresholdForm";

import {
  getInventoryHistory,
  getInventoryProduct,
} from "@/lib/admin/inventory/queries";

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const [inventory, history] = await Promise.all([
    getInventoryProduct(productId),
    getInventoryHistory(productId),
  ]);

  if (!inventory) {
    notFound();
  }

  const product = Array.isArray(inventory.products)
    ? inventory.products[0]
    : inventory.products;

  const available = Math.max(
    inventory.quantity - inventory.reserved_quantity,
    0
  );

  const isLowStock =
    available <= inventory.low_stock_threshold;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold">
          Inventory Management
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage stock, configure low-stock alerts, and review
          inventory history.
        </p>
      </div>

      {/* Product + Stock Summary */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold">
            {product?.name ?? "Unknown Product"}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            SKU: {product?.sku || "—"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {/* Current Stock */}
          <div className="rounded-md border p-4">
            <p className="text-sm text-gray-500">
              Current Stock
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {inventory.quantity}
            </p>
          </div>

          {/* Reserved */}
          <div className="rounded-md border p-4">
            <p className="text-sm text-gray-500">
              Reserved
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {inventory.reserved_quantity}
            </p>
          </div>

          {/* Available */}
          <div className="rounded-md border p-4">
            <p className="text-sm text-gray-500">
              Available
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {available}
            </p>
          </div>

          {/* Status */}
          <div className="rounded-md border p-4">
            <p className="text-sm text-gray-500">
              Status
            </p>

            <div className="mt-2">
              {isLowStock ? (
                <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                  Low Stock
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  In Stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Threshold */}
      <InventoryThresholdForm
        productId={inventory.product_id}
        currentThreshold={inventory.low_stock_threshold}
      />

      {/* Stock Adjustment */}
      <InventoryAdjustmentForm
        productId={inventory.product_id}
        currentQuantity={inventory.quantity}
      />

      {/* Stock History */}
      <section className="rounded-lg border bg-white">
        <div className="border-b p-6">
          <h3 className="font-semibold">
            Stock History
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Every manual inventory adjustment is recorded
            here.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-medium">
                  Date
                </th>

                <th className="px-5 py-3 font-medium">
                  Change
                </th>

                <th className="px-5 py-3 font-medium">
                  Before
                </th>

                <th className="px-5 py-3 font-medium">
                  After
                </th>

                <th className="px-5 py-3 font-medium">
                  Reason
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-5 py-4 text-gray-600">
                    {new Date(
                      entry.created_at
                    ).toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-4 font-semibold">
                    {entry.quantity_change > 0
                      ? `+${entry.quantity_change}`
                      : entry.quantity_change}
                  </td>

                  <td className="px-5 py-4">
                    {entry.quantity_before}
                  </td>

                  <td className="px-5 py-4">
                    {entry.quantity_after}
                  </td>

                  <td className="px-5 py-4">
                    {entry.reason}
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No stock adjustments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}