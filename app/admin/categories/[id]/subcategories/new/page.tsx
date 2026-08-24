import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminCategory,
} from "@/lib/admin/categories/queries";
import SubcategoryForm from "@/components/categories/subcategories/SubcategoryForm";

export default async function NewSubcategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const category = await getAdminCategory(id);

  if (!category) {
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
          Add Subcategory
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add a subcategory under{" "}
          <span className="font-medium">
            {category.name}
          </span>
          .
        </p>
      </div>

      <SubcategoryForm categoryId={category.id} />
    </div>
  );
}
