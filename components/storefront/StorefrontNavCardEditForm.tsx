"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Card = {
  id: string;
  card_type: "category" | "subcategory" | "product" | "custom";
  title: string;
  image_url: string | null;
  href: string | null;
  is_active: boolean;
  display_order: number;
};

export default function StorefrontNavCardEditForm({
  card,
}: {
  card: Card;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(card.title);
  const [href, setHref] = useState(card.href ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    String(card.display_order)
  );
  const [isActive, setIsActive] = useState(card.is_active);
  const [imageUrl, setImageUrl] = useState(card.image_url);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!href.trim()) {
      setError("Target URL is required.");
      return;
    }

    const order = Number(displayOrder);

    if (!Number.isInteger(order) || order < 0) {
      setError("Display order must be a non-negative integer.");
      return;
    }

    setSaving(true);

    try {
      let finalImageUrl = removeImage ? null : imageUrl;

      if (imageFile) {
        if (imageFile.size > 5 * 1024 * 1024) {
          throw new Error("Image must be 5MB or smaller.");
        }

        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ];

        if (!allowedTypes.includes(imageFile.type)) {
          throw new Error(
            "Only JPG, PNG, WebP, and GIF images are supported."
          );
        }

        const extension =
          imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = `storefront/nav-cards/${card.id}/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("storefront_nav_cards")
        .update({
          title: title.trim(),
          href: href.trim(),
          image_url: finalImageUrl,
          is_active: isActive,
          display_order: order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", card.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setImageUrl(finalImageUrl);
      setImageFile(null);
      setRemoveImage(false);
      setSuccess("Storefront card updated successfully.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update storefront card."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 font-semibold">Card</h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Card Type
            </label>

            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm capitalize">
              {card.card_type}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Title
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Target URL
            </label>

            <input
              value={href}
              onChange={(event) => setHref(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setIsActive(event.target.checked)
              }
            />
            Active
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 font-semibold">Image</h2>

        {imageUrl && !removeImage && (
          <div className="mb-5">
            <img
              src={imageUrl}
              alt={title}
              className="h-32 w-32 rounded-full object-cover"
            />

            <button
              type="button"
              onClick={() => setRemoveImage(true)}
              className="mt-3 text-sm text-red-600 hover:underline"
            >
              Remove image
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) =>
            setImageFile(event.target.files?.[0] ?? null)
          }
          className="block w-full text-sm"
        />

        <p className="mt-2 text-xs text-gray-500">
          JPG, PNG, WebP, or GIF. Maximum 5MB.
        </p>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/storefront")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
