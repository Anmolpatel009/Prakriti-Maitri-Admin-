"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

type Props = {
  category: Category;
};

export default function CategoryEditForm({
  category,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(
    category.description ?? ""
  );
  const [isActive, setIsActive] = useState(
    category.is_active
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();

    if (!cleanName) {
      setError("Category name is required.");
      return;
    }

    if (!cleanSlug) {
      setError("Category slug is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError(
        "Slug can contain only lowercase letters, numbers, and hyphens."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("categories")
      .update({
        name: cleanName,
        slug: cleanSlug,
        description: description.trim() || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", category.id);

    if (error) {
      if (error.code === "23505") {
        setError(
          "A category with this slug already exists."
        );
      } else {
        setError(error.message);
      }

      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess("Category updated successfully.");

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
            Category Name
          </label>

          <input
            required
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
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
            className="w-full rounded-md border px-3 py-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            Must be unique and URL-safe.
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
            className="w-full rounded-md border px-3 py-2"
          />
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

        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
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
            Back
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}