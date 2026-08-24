import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminCategory,
} from "@/lib/admin/categories/queries";
import CategoryEditForm from "@/components/categories/CategoryEditForm";

export default async function CategoryEditPage({
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
          href="/admin/categories"
          className="text-sm underline"
        >
          ← Back to Categories
        </Link>

        <h2 className="mt-4 text-2xl font-semibold">
          Edit Category
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Update category information and status.
        </p>
      </div>

      <CategoryEditForm category={category} />
    </div>
  );
}