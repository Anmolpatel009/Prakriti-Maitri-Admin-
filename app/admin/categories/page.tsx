import Link from "next/link";
import {
  getAdminCategories,
  getAdminSubcategories,
} from "@/lib/admin/categories/queries";

export default async function CategoriesPage() {
  const [categories, subcategories] = await Promise.all([
    getAdminCategories(),
    getAdminSubcategories(),
  ]);

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Categories
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage product categories and subcategories.
          </p>
        </div>

        <Link
          href="/admin/categories/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Add Category
        </Link>
      </div>

      <div className="space-y-6">
        {categories.map((category) => {
          const categorySubcategories =
            subcategories.filter(
              (subcategory) =>
                subcategory.category_id === category.id
            );

          return (
            <section
              key={category.id}
              className="overflow-hidden rounded-lg border bg-white"
            >
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h3 className="font-semibold">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {category.description ||
                      "No description"}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    /{category.slug}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                    {category.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="text-sm font-medium underline"
                  >
                    Manage
                  </Link>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Subcategories
                  </h4>

                  <Link
                    href={`/admin/categories/${category.id}/subcategories/new`}
                    className="text-sm underline"
                  >
                    Add Subcategory
                  </Link>
                </div>

                {categorySubcategories.length > 0 ? (
                  <div className="divide-y rounded-md border">
                    {categorySubcategories.map(
                      (subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {subcategory.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              /{subcategory.slug}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">
                              Order:{" "}
                              {subcategory.display_order}
                            </span>

                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                              {subcategory.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>

                            <Link
                              href={`/admin/categories/${category.id}/subcategories/${subcategory.id}`}
                              className="text-sm underline"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
                    No subcategories yet.
                  </p>
                )}
              </div>
            </section>
          );
        })}

        {categories.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center text-sm text-gray-500">
            No categories found.
          </div>
        )}
      </div>
    </div>
  );
}
