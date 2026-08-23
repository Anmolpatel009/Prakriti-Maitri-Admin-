export default function AdminDashboard() {
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
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Products</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold">Recent Orders</h3>
          <p className="mt-2 text-sm text-gray-500">
            Order data will appear here.
          </p>
        </section>

        <section className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold">Stock Alerts</h3>
          <p className="mt-2 text-sm text-gray-500">
            Low-stock products will appear here.
          </p>
        </section>
      </div>
    </div>
  );
}
