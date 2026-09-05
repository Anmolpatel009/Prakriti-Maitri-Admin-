"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type Props = {
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
};

type CardType = "category" | "subcategory" | "product" | "custom";

export default function StorefrontNavCardForm({
  categories,
  subcategories,
  products,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [cardType, setCardType] = useState<CardType>("category");
  const [sourceId, setSourceId] = useState("");
  const [title, setTitle] = useState("");
  const [href, setHref] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredSubcategories = useMemo(
    () => subcategories.filter((item) => item.is_active),
    [subcategories]
  );

  function handleTypeChange(type: CardType) {
    setCardType(type);
    setSourceId("");
    setTitle("");
    setHref("");
  }

  function handleSourceChange(id: string) {
    setSourceId(id);

    if (cardType === "category") {
      const category = categories.find((item) => item.id === id);

      if (category) {
        setTitle(category.name);
        setHref(`/shop/${category.slug}`);
      }
    }

    if (cardType === "subcategory") {
      const subcategory = subcategories.find(
        (item) => item.id === id
      );

      const category = subcategory
        ? categories.find(
            (item) => item.id === subcategory.category_id
          )
        : null;

      if (subcategory) {
        setTitle(subcategory.name);

        if (category) {
          setHref(
            `/shop/${category.slug}/${subcategory.slug}`
          );
        }
      }
    }

    if (cardType === "product") {
      const product = products.find((item) => item.id === id);

      if (product) {
        setTitle(product.name);
        setHref(`/products/${product.slug}`);
      }
    }
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setImageFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller.");
      event.target.value = "";
      setImageFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG, WebP, and GIF images are supported."
      );
      event.target.value = "";
      setImageFile(null);
      return;
    }

    setError("");
    setImageFile(file);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (cardType !== "custom" && !sourceId) {
      setError("Please select a source.");
      return;
    }

    if (cardType === "custom" && !href.trim()) {
      setError("Custom cards require a target URL.");
      return;
    }

    const order = Number(displayOrder);

    if (!Number.isInteger(order) || order < 0) {
      setError("Display order must be a non-negative integer.");
      return;
    }

    setSaving(true);

    try {
      const { data: card, error: insertError } = await supabase
        .from("storefront_nav_cards")
        .insert({
          card_type: cardType,
          category_id:
            cardType === "category" ? sourceId : null,
          subcategory_id:
            cardType === "subcategory" ? sourceId : null,
          product_id:
            cardType === "product" ? sourceId : null,
          title: title.trim(),
          image_url: null,
          href: href.trim() || null,
          is_active: isActive,
          display_order: order,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (!card) {
        throw new Error("Card was created but its ID was not returned.");
      }

      let imageUrl: string | null = null;

      if (imageFile) {
        const extension =
          imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath =
          `storefront/nav-cards/${card.id}/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          await supabase
            .from("storefront_nav_cards")
            .delete()
            .eq("id", card.id);

          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;

        const { error: imageUpdateError } = await supabase
          .from("storefront_nav_cards")
          .update({
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", card.id);

        if (imageUpdateError) {
          await supabase.storage
            .from("product-images")
            .remove([filePath]);

          await supabase
            .from("storefront_nav_cards")
            .delete()
            .eq("id", card.id);

          throw new Error(imageUpdateError.message);
        }
      }

      router.push("/admin/storefront");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create storefront card."
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

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 font-semibold">Card Type</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["category", "Category"],
              ["subcategory", "Subcategory"],
              ["product", "Product"],
              ["custom", "Custom"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                cardType === value
                  ? "border-black bg-black text-white"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {cardType !== "custom" && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <label className="mb-2 block text-sm font-medium">
            {cardType === "category"
              ? "Category"
              : cardType === "subcategory"
                ? "Subcategory"
                : "Product"}
          </label>

          <select
            value={sourceId}
            onChange={(event) =>
              handleSourceChange(event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">Select {cardType}</option>

            {cardType === "category" &&
              categories
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}

            {cardType === "subcategory" &&
              filteredSubcategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}

            {cardType === "product" &&
              products
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
          </select>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 font-semibold">Card Details</h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Title
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Card title"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Image
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="block w-full text-sm"
            />

            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG, WebP, or GIF. Maximum 5MB.
            </p>

            {imageFile && (
              <p className="mt-2 text-xs text-gray-600">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Target URL
            </label>

            <input
              value={href}
              onChange={(event) => setHref(event.target.value)}
              placeholder="/shop/example"
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
          {saving ? "Creating..." : "Create Card"}
        </button>
      </div>
    </form>
  );
}
