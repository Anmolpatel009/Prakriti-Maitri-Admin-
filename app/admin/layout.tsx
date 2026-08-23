import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <aside className="fixed inset-y-0 left-0 w-64 border-r bg-white">
        <div className="border-b px-6 py-5">
          <h1 className="text-lg font-semibold">Prakriti Maitri</h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            <a
              href="/admin"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Dashboard
            </a>

            <a
              href="/admin/products"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Products
            </a>

            <a
              href="/admin/inventory"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Inventory
            </a>

            <a
              href="/admin/orders"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Orders
            </a>

            <a
              href="/admin/customers"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Customers
            </a>

            <a
              href="/admin/storefront"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Storefront
            </a>

            <a
              href="/admin/alerts"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Alerts
            </a>
          </div>

          <div className="mt-8 border-t pt-4">
            <a
              href="/admin/settings"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Settings
            </a>
          </div>
        </nav>
      </aside>

      <div className="ml-64 min-h-screen">
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">
          <div>
            <p className="text-sm text-gray-500">Administration</p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
