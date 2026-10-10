import Link from "next/link";
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
            <Link
              href="/admin"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/products"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Products
            </Link>

            <Link
              href="/admin/products/ordering"
              className="ml-3 block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              ↳ Product Ordering
            </Link>

            <Link
              href="/admin/products/product-card-modification"
              className="ml-3 block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              ↳ Product Card Modification
            </Link>

            <Link
              href="/admin/products/navbar-modification"
              className="ml-3 block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              ↳ Navbar Modification
            </Link>

<Link
              href="/admin/products/announcements"
              className="ml-3 block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              &#x21B3; Announcements
            </Link>


            <Link
              href="/admin/inventory"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Inventory
            </Link>

            <Link
              href="/admin/extra-charges"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Extra Charges &amp; Promos
            </Link>

            <Link
              href="/admin/orders"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Orders
            </Link>

            <Link
              href="/admin/customers"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Customers
            </Link>

            <Link
              href="/admin/bulk-orders"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Bulk Order Enquiries
            </Link>
            <Link
              href="/admin/wedding-return-gifts"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Wedding Return Gift Enquiries
            </Link>
            <Link
              href="/admin/custom-bags"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Custom Bags
            </Link>

            <Link href="/admin/homepage">Homepage</Link>
<Link
              href="/admin/media"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Media
            </Link><Link
              href="/admin/storefront"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Storefront
            </Link>

            <Link
              href="/admin/alerts"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Alerts
            </Link>
          </div>

          <div className="mt-8 border-t pt-4">
            <Link
              href="/admin/settings"
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-100"
            >
              Settings
            </Link>
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
