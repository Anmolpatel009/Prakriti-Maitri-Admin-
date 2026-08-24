import Link from "next/link";
import CategoryForm from "@/components/categories/CategoryForm";

export default function NewCategoryPage() {
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
          Add Category
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Create a new product category.
        </p>
      </div>

      <CategoryForm />
    </div>
  );
}
