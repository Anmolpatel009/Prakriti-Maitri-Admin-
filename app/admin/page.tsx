import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin/dashboard/queries";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getCustomerName(order: any) {
  const profile = Array.isArray(order.profiles)
    ? order.profiles[0]
    : order.profiles;

  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");

  return name || "Guest Customer";
}

export default async function AdminDashboard() {
  const { stats, recentOrders, lowStock } =
    await getAdminDashboardData();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your Prakriti Maitri store.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.totalOrders}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Paid Revenue</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(stats.revenue)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Products</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.products}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="mt-2 text-2xl font-semibold">
            {stats.lowStock}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Orders</h3>

            <Link
              href="/admin/orders"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No orders yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {getCustomerName(order)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(order.created_at)} ·{" "}
                      {order.status}
                    </p>
                  </div>

                  <p className="text-sm font-semibold">
                    {formatCurrency(Number(order.total ?? 0))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Stock Alerts</h3>

            <Link
              href="/admin/inventory"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View inventory
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No low-stock products.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {lowStock.slice(0, 5).map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.product?.name ?? "Unknown Product"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      SKU: {item.product?.sku ?? "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {item.available_stock} available
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Threshold: {item.low_stock_threshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
