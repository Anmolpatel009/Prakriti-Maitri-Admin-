import NavbarModificationManager from "@/components/navbar-modification/NavbarModificationManager";
import {
  getAdminCategories,
  getAdminSubcategories,
} from "@/lib/admin/categories/queries";
import { getNavbarCustomization } from "@/lib/admin/navbar-modification/queries";
import type { NavbarItem } from "@/lib/admin/navbar-modification/queries";

export default async function NavbarModificationPage() {
  const [categories, subcategories] = await Promise.all([
    getAdminCategories(),
    getAdminSubcategories(),
  ]);

  const fallbackItems: NavbarItem[] = [
    {
      key: "new",
      type: "link",
      label: "NEW",
      href: "/shop?category=new",
    },

    ...categories
      .filter((category) => category.is_active)
      .map((category) => ({
        key: `category:${category.id}`,
        type: "category" as const,
        id: category.id,
      })),

    {
      key: "reviews",
      type: "link",
      label: "REVIEWS",
      href: "/reviews",
    },

    {
      key: "bulk_orders",
      type: "bulk_orders",
      label: "BULK ORDERS",
      href: "/bulk-order",
    },
  ];

  const config = await getNavbarCustomization(fallbackItems);

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">
      <NavbarModificationManager
        initialConfig={config}
        categories={categories}
        subcategories={subcategories}
      />
    </main>
  );
}
