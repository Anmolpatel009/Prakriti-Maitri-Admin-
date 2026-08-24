"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CategoryForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
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
      .insert({
        name: cleanName,
        slug: cleanSlug,
        description: description.trim() || null,
        is_active: isActive,
      });

    if (error) {
      if (error.code === "23505") {
        setError(
          "A category with this slug already exists. Please use a different slug."
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
            Category Name
          </label>

          <input
            required
            value={name}
            onChange={(event) =>
              handleNameChange(event.target.value)
            }
            placeholder="Jute Bags"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-1"
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
            placeholder="jute-bags"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-1"
          />

          <p className="mt-1 text-xs text-gray-500">
            URL-safe identifier. Must be unique.
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
            placeholder="Eco-friendly products made from natural materials."
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-1"
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

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/categories")}
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Category"}
          </button>
        </div>
      </div>
    </form>
  );
}
