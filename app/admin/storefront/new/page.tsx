import Link from "next/link";
import StorefrontNavCardForm from "@/components/storefront/StorefrontNavCardForm";
import { getAdminCategories, getAdminSubcategories } from "@/lib/admin/categories/queries";
import { getAdminProducts } from "@/lib/admin/products/queries";

export default async function NewStorefrontCardPage() {
  const [categories, subcategories, products] = await Promise.all([
    getAdminCategories(),
    getAdminSubcategories(),
    getAdminProducts(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Add Storefront Card</h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a circular navigation card for the storefront rail.
          </p>
        </div>

        <Link
          href="/admin/storefront"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to Storefront
        </Link>
      </div>

      <StorefrontNavCardForm
        categories={categories}
        subcategories={subcategories}
        products={products}
      />
    </main>
  );
}
