import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminCategory,
  getAdminSubcategory,
} from "@/lib/admin/categories/queries";
import SubcategoryEditForm from "@/components/categories/subcategories/SubcategoryEditForm";

export default async function EditSubcategoryPage({
  params,
}: {
  params: Promise<{
    id: string;
    subcategoryId: string;
  }>;
}) {
  const { id, subcategoryId } = await params;

  const [category, subcategory] = await Promise.all([
    getAdminCategory(id),
    getAdminSubcategory(subcategoryId),
  ]);

  if (!category || !subcategory) {
    notFound();
  }

  // Protect against editing a subcategory
  // through the wrong category URL.
  if (subcategory.category_id !== category.id) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/categories/${category.id}`}
          className="text-sm underline"
        >
          ← Back to Category
        </Link>

        <h2 className="mt-4 text-2xl font-semibold">
          Edit Subcategory
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Update{" "}
          <span className="font-medium">
            {subcategory.name}
          </span>{" "}
          under{" "}
          <span className="font-medium">
            {category.name}
          </span>
          .
        </p>
      </div>

      <SubcategoryEditForm
        subcategory={subcategory}
      />
    </div>
  );
}