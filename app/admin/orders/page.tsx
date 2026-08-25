import Link from "next/link";
import { getAdminOrders } from "@/lib/admin/orders/queries";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const confirmedOrders = orders.filter(
    (order) => order.status === "confirmed"
  ).length;

  const paidOrders = orders.filter(
    (order) => order.payment_status === "paid"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage customer orders.
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Orders
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {orders.length}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {pendingOrders}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Confirmed
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {confirmedOrders}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Paid
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {paidOrders}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            All Orders
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">
              No orders found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Order ID
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Customer
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Payment
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Total
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Created
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {order.customerName}
                        </p>

                        {order.profile?.phone && (
                          <p className="text-xs text-gray-500">
                            {order.profile.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                        {order.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {order.payment_status ?? "—"}
                        </p>

                        {order.payment_method && (
                          <p className="text-xs text-gray-500">
                            {order.payment_method}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium">
                      ₹{Number(order.total).toFixed(2)}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {new Date(
                        order.created_at
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
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