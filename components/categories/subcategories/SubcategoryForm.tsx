"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  categoryId: string;
};

export default function SubcategoryForm({
  categoryId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);

    if (!slug) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();
    const order = Number(displayOrder);

    if (!cleanName) {
      setError("Subcategory name is required.");
      return;
    }

    if (!cleanSlug) {
      setError("Subcategory slug is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError(
        "Slug can contain only lowercase letters, numbers, and hyphens."
      );
      return;
    }

    if (!Number.isInteger(order) || order < 0) {
      setError(
        "Display order must be a non-negative integer."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("subcategories")
      .insert({
        category_id: categoryId,
        name: cleanName,
        slug: cleanSlug,
        description: description.trim() || null,
        display_order: order,
        is_active: isActive,
      });

    if (error) {
      if (error.code === "23505") {
        setError(
          "A subcategory with this slug already exists in this category."
        );
      } else {
        setError(error.message);
      }

      setSaving(false);
      return;
    }

    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl rounded-lg border bg-white p-6"
    >
      <div className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Subcategory Name
          </label>

          <input
            required
            value={name}
            onChange={(event) =>
              handleNameChange(event.target.value)
            }
            placeholder="Embroidered Side Bags"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Slug
          </label>

          <input
            required
            value={slug}
            onChange={(event) =>
              setSlug(event.target.value.toLowerCase())
            }
            placeholder="embroidered-side-bags"
            className="w-full rounded-md border px-3 py-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            Must be unique within this category.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Description
          </label>

          <textarea
            rows={4}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Our embroidered side bag collection."
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Display Order
          </label>

          <input
            type="number"
            min="0"
            step="1"
            value={displayOrder}
            onChange={(event) =>
              setDisplayOrder(event.target.value)
            }
            className="w-full rounded-md border px-3 py-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            Lower numbers appear first.
          </p>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(event.target.checked)
            }
          />

          <span className="text-sm font-medium">
            Active
          </span>
        </label>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/admin/categories")
            }
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Subcategory"}
          </button>
        </div>
      </div>
    </form>
  );
}
