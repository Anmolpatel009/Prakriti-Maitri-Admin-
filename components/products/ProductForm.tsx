"use client";

import { FormEvent, useMemo, useState } from "react";
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
  display_order: number;
};

type Props = {
  categories: Category[];
  subcategories: Subcategory[];
};

export default function ProductForm({
  categories,
  subcategories,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredSubcategories = useMemo(
    () =>
      subcategories.filter(
        (subcategory) =>
          subcategory.category_id === categoryId &&
          subcategory.is_active
      ),
    [subcategories, categoryId]
  );

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slug) {
      setSlug(makeSlug(value));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSaving(true);

    const { data, error } = await supabase.rpc(
      "create_product_with_inventory",
      {
        p_category_id: categoryId || null,
        p_subcategory_id: subcategoryId || null,
        p_name: name.trim(),
        p_slug: slug.trim(),
        p_description: description.trim() || null,
        p_price: Number(price),
        p_compare_at_price: compareAtPrice
          ? Number(compareAtPrice)
          : null,
        p_sku: sku.trim(),
        p_is_active: isActive,
        p_quantity: Number(quantity),
      }
    );

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    if (!data) {
      setError("Product could not be created.");
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <section className="rounded-lg border bg-white p-6">
        <h3 className="mb-5 font-semibold">Product Information</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Product name
            </label>
            <input
              required
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Classic Jute Side Bag"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Slug
            </label>
            <input
              required
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="classic-jute-side-bag"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              SKU
            </label>
            <input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="PM-JUTE-001"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <h3 className="mb-5 font-semibold">Pricing</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Price (₹)
            </label>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Compare-at price (₹)
            </label>
            <input
              min="0"
              step="0.01"
              type="number"
              value={compareAtPrice}
              onChange={(event) =>
                setCompareAtPrice(event.target.value)
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <h3 className="mb-5 font-semibold">Category</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Category
            </label>

            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setSubcategoryId("");
              }}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Select category</option>

              {categories
                .filter((category) => category.is_active)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Subcategory
            </label>

            <select
              value={subcategoryId}
              onChange={(event) =>
                setSubcategoryId(event.target.value)
              }
              disabled={!categoryId}
              className="w-full rounded-md border px-3 py-2 disabled:bg-gray-100"
            >
              <option value="">Select subcategory</option>

              {filteredSubcategories.map((subcategory) => (
                <option
                  key={subcategory.id}
                  value={subcategory.id}
                >
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <h3 className="mb-5 font-semibold">Inventory</h3>

        <div className="max-w-sm">
          <label className="mb-1 block text-sm font-medium">
            Initial quantity
          </label>

          <input
            required
            min="0"
            step="1"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />

          <span className="text-sm font-medium">
            Make product active immediately
          </span>
        </label>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-md border px-5 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Product"}
        </button>
      </div>
    </form>
  );
}
