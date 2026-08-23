import { notFound } from "next/navigation";
import {
  getInventoryHistory,
  getInventoryProduct,
} from "@/lib/admin/inventory/queries";
import InventoryAdjustmentForm from "@/components/inventory/InventoryAdjustmentForm";

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

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">
          Inventory Management
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage stock and review inventory history.
        </p>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold">
            {product?.name ?? "Unknown Product"}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            SKU: {product?.sku || "—"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border p-4">
            <p className="text-sm text-gray-500">
              Current Stock
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {inventory.quantity}
            </p>
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm text-gray-500">
              Reserved
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {inventory.reserved_quantity}
            </p>
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm text-gray-500">
              Available
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {available}
            </p>
          </div>
        </div>
      </div>

      <InventoryAdjustmentForm
        productId={inventory.product_id}
        currentQuantity={inventory.quantity}
      />

      <section className="mt-6 rounded-lg border bg-white">
        <div className="border-b p-6">
          <h3 className="font-semibold">
            Stock History
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Every manual inventory adjustment is recorded here.
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
