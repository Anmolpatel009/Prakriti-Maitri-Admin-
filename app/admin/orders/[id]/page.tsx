import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/admin/orders/queries";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await getAdminOrder(id);

  if (!order) {
    notFound();
  }

  const profile = Array.isArray(order.profiles)
    ? order.profiles[0]
    : order.profiles;

  const items = order.order_items ?? [];

  const customerName =
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ") || "Unknown Customer";

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Order Details
          </h1>

          <p className="mt-1 font-mono text-sm text-gray-500">
            #{order.id}
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Back to Orders
        </Link>
      </div>

      {/* Order Summary */}
      <section className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Order placed
            </p>

            <p className="mt-1 font-medium">
              {new Date(order.created_at).toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Order Status
            </p>

            <span className="mt-1 inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
              {order.status}
            </span>
          </div>
        </div>
      </section>

      {/* Customer + Shipping */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">
            Customer
          </h2>

          <div className="mt-4 space-y-2 text-sm">
            <div>
              <p className="text-gray-500">
                Name
              </p>

              <p className="font-medium">
                {customerName}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Phone
              </p>

              <p className="font-medium">
                {order.shipping_phone ||
                  profile?.phone ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                User ID
              </p>

              <p className="break-all font-mono text-xs text-gray-600">
                {order.user_id}
              </p>
            </div>
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">
            Shipping Address
          </h2>

          <div className="mt-4 text-sm">
            <p className="font-medium">
              {order.shipping_first_name}{" "}
              {order.shipping_last_name}
            </p>

            <p className="mt-2 text-gray-600">
              {order.shipping_address}
            </p>

            <p className="text-gray-600">
              {order.shipping_city},{" "}
              {order.shipping_state}
            </p>

            <p className="text-gray-600">
              {order.shipping_country}
            </p>

            <p className="text-gray-600">
              {order.shipping_postal_code}
            </p>

            <p className="mt-2 text-gray-600">
              Phone: {order.shipping_phone}
            </p>
          </div>
        </section>
      </div>

      {/* Order Items */}
      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b p-6">
          <h2 className="font-semibold">
            Order Items
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Products included in this order.
          </p>
        </div>

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
                  Quantity
                </th>

                <th className="px-5 py-3 font-medium">
                  Unit Price
                </th>

                <th className="px-5 py-3 font-medium">
                  Line Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium">
                      {item.product_name}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {item.product_sku || "—"}
                  </td>

                  <td className="px-5 py-4">
                    {item.quantity}
                  </td>

                  <td className="px-5 py-4">
                    ₹
                    {Number(
                      item.unit_price
                    ).toFixed(2)}
                  </td>

                  <td className="px-5 py-4 font-medium">
                    ₹
                    {Number(
                      item.line_total
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No items found for this order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment + Totals */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">
            Payment
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Method
              </span>

              <span className="font-medium">
                {order.payment_method || "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Status
              </span>

              <span className="font-medium">
                {order.payment_status || "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-gray-500">
                Payment ID
              </span>

              <span className="max-w-xs break-all text-right font-mono text-xs">
                {order.payment_id || "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Totals */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">
            Order Summary
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">
                Subtotal
              </span>

              <span>
                ₹
                {Number(
                  order.subtotal
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Shipping
              </span>

              <span>
                ₹
                {Number(
                  order.shipping_fee
                ).toFixed(2)}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>

                <span>
                  ₹
                  {Number(
                    order.total
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}