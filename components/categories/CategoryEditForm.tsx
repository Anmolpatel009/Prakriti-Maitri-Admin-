"use client";

import { prepareImageForUpload } from "@/lib/utils/prepare-image-for-upload";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url?: string | null;
  is_active: boolean;
};

type CategoryEditFormProps = {
  category: Category;
};

const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function CategoryEditForm({
  category,
}: CategoryEditFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(
    category.description ?? "",
  );

  const [imageUrl, setImageUrl] = useState<string | null>(
    category.image_url ?? null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    category.image_url ?? null,
  );

  const [saving, setSaving] = useState(false);
  const [hasSubcategories, setHasSubcategories] =
    useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(imageUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, imageUrl]);

  // CATEGORY_SUBCATEGORY_CHECK
  useEffect(() => {
    let cancelled = false;

    async function checkSubcategories() {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id")
        .eq("category_id", category.id)
        .limit(1);

      if (cancelled) return;

      if (error) {
        console.error("Category subcategory check error:", error);
        setHasSubcategories(null);
        return;
      }

      setHasSubcategories((data ?? []).length > 0);
    }

    checkSubcategories();

    return () => {
      cancelled = true;
    };
  }, [category.id]);

  function handleImageChange(file: File | undefined) {
    if (!file) return;

    setError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Source image must be 25 MB or less; optimized upload limit is 5 MB.");
      return;
    }

    setImageFile(file);
  }

  async function handleRemoveCategory() {
    setError("");

    if (hasSubcategories === null) {
      setError("Unable to verify subcategories right now. Please try again.");
      return;
    }

    if (hasSubcategories) {
      setError("This category has subcategories. Remove them first.");
      return;
    }

    const confirmed = window.confirm(
      `Remove "${category.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      // Final guard immediately before DELETE.
      const {
        data: currentSubcategories,
        error: subcategoryError,
      } = await supabase
        .from("subcategories")
        .select("id")
        .eq("category_id", category.id)
        .limit(1);

      if (subcategoryError) {
        throw new Error(subcategoryError.message);
      }

      if ((currentSubcategories ?? []).length > 0) {
        setHasSubcategories(true);
        throw new Error("This category has subcategories. Remove them first.");
      }

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? `Could not remove category: ${removeError.message}`
          : "Could not remove category."
      );
      setSaving(false);
    }
  }

  async function uploadCategoryImage(file: File) {
    file = await prepareImageForUpload(file, "category");
    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type.split("/")[1];

    const path = `categories/${category.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(path);

    return {
      url: data.publicUrl,
      path,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    let uploadedPath: string | null = null;

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const uploaded = await uploadCategoryImage(imageFile);

        finalImageUrl = uploaded.url;
        uploadedPath = uploaded.path;
      }

      const { error: updateError } = await supabase
        .from("categories")
        .update({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          image_url: finalImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", category.id);

      if (updateError) {
        if (uploadedPath) {
          await supabase.storage
            .from("product-images")
            .remove([uploadedPath]);
        }

        throw new Error(updateError.message);
      }

      setImageUrl(finalImageUrl);
      setImageFile(null);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium"
        >
          Name
        </label>

        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-2 block text-sm font-medium"
        >
          Slug
        </label>

        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium"
        >
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      {/* Category Image */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Category Image
        </label>

        {imagePreview && (
          <div className="mb-4 overflow-hidden rounded-lg border bg-gray-50">
            <img
              src={imagePreview}
              alt={`${name} category`}
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
          JPG, PNG, WebP or GIF · Source up to 25 MB; optimized upload up to 5 MB
        </p>

        {imageFile && (
          <p className="mt-1 text-xs text-gray-600">
            New image selected: {imageFile.name}
          </p>
        )}
      </div>


        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <h3 className="font-semibold text-red-700">
            Remove Category
          </h3>

          {hasSubcategories === null ? (
            <p className="mt-1 text-sm text-gray-600">
              Checking subcategories...
            </p>
          ) : hasSubcategories ? (
            <p className="mt-1 text-sm text-gray-600">
              This category has subcategories. Remove all
              subcategories first.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-gray-600">
                This category has no subcategories and can be removed.
              </p>

              <button
                type="button"
                onClick={handleRemoveCategory}
                disabled={saving}
                className="mt-4 rounded-md border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Removing..." : "Remove Category"}
              </button>
            </>
          )}
        </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
