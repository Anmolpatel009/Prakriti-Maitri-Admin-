"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function CategoryForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
          .replace(/^-+|-+$/g, ""),
      );
    }
  }

  function handleImageChange(file: File | undefined) {
    if (!file) return;

    setError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must be 5 MB or less.");
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
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
        "Slug can contain only lowercase letters, numbers, and hyphens.",
      );
      return;
    }

    setSaving(true);

    let createdCategoryId: string | null = null;
    let uploadedPath: string | null = null;

    try {
      // 1. Create the category first so we have its UUID.
      const { data: category, error: insertError } = await supabase
        .from("categories")
        .insert({
          name: cleanName,
          slug: cleanSlug,
          description: description.trim() || null,
          is_active: isActive,
        })
        .select("id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          setError(
            "A category with this slug already exists. Please use a different slug.",
          );
        } else {
          setError(insertError.message);
        }

        setSaving(false);
        return;
      }

      createdCategoryId = category.id;

      // 2. Upload category image if one was selected.
      if (imageFile) {
        const extension =
          imageFile.type === "image/jpeg"
            ? "jpg"
            : imageFile.type.split("/")[1];

        const path = `categories/${createdCategoryId}/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });

        if (uploadError) {
          await supabase
            .from("categories")
            .delete()
            .eq("id", createdCategoryId);

          throw new Error(uploadError.message);
        }

        uploadedPath = path;

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);

        // 3. Save the public image URL on the category.
        const { error: imageUpdateError } = await supabase
          .from("categories")
          .update({
            image_url: data.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", createdCategoryId);

        if (imageUpdateError) {
          await supabase.storage
            .from("product-images")
            .remove([uploadedPath]);

          await supabase
            .from("categories")
            .delete()
            .eq("id", createdCategoryId);

          throw new Error(imageUpdateError.message);
        }
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create category.",
      );
    } finally {
      setSaving(false);
    }
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

        {/* Category Image */}
        <div>
          <label
            htmlFor="category-image"
            className="mb-2 block text-sm font-medium"
          >
            Category Image
          </label>

          {imagePreview && (
            <div className="mb-4 overflow-hidden rounded-lg border bg-gray-50">
              <img
                src={imagePreview}
                alt={`${name || "Category"} category`}
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          <input
            id="category-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) =>
              handleImageChange(event.target.files?.[0])
            }
            className="block w-full text-sm"
          />

          <p className="mt-2 text-xs text-gray-500">
            JPG, PNG, WebP or GIF · Maximum 5 MB
          </p>

          {imageFile && (
            <p className="mt-1 text-xs text-gray-600">
              Selected: {imageFile.name}
            </p>
          )}
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
