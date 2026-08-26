import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCustomer } from "@/lib/admin/customers/queries";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await getAdminCustomer(id);

  if (!customer) {
    notFound();
  }

  const orders = [...customer.orders].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  const totalOrders = orders.length;

  const totalSpent = orders.reduce(
    (total, order) =>
      total + Number(order.total ?? 0),
    0
  );

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Customer Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {customer.customerName}
          </p>
        </div>

        <Link
          href="/admin/customers"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Back to Customers
        </Link>
      </div>

      {/* Customer Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Orders
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {totalOrders}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Order Value
          </p>

          <p className="mt-2 text-2xl font-semibold">
            ₹{totalSpent.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">
            Onboarding
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {customer.onboarding_complete
              ? "Complete"
              : "Incomplete"}
          </p>
        </div>
      </div>

      {/* Customer Information */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="font-semibold">
          Customer Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">
              Name
            </p>

            <p className="mt-1 font-medium">
              {customer.customerName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Phone
            </p>

            <p className="mt-1 font-medium">
              {customer.phone || "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Country
            </p>

            <p className="mt-1 font-medium">
              {customer.country || "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Onboarding
            </p>

            <p className="mt-1 font-medium">
              {customer.onboarding_complete
                ? "Complete"
                : "Incomplete"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Customer ID
            </p>

            <p className="mt-1 break-all font-mono text-xs text-gray-600">
              {customer.id}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Joined
            </p>

            <p className="mt-1 font-medium">
              {new Date(
                customer.created_at
              ).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>

      {/* Order History */}
      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b p-6">
          <h2 className="font-semibold">
            Order History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Orders placed by this customer.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            This customer has no orders yet.
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
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                        {order.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {order.payment_status ||
                            "—"}
                        </p>

                        {order.payment_method && (
                          <p className="text-xs text-gray-500">
                            {order.payment_method}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium">
                      ₹
                      {Number(
                        order.total
                      ).toFixed(2)}
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
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}