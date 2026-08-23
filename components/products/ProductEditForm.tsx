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

type Product = {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  sku: string | null;
  is_active: boolean;
  quantity: number;
  reservedQuantity: number;
};

type Props = {
  product: Product;
  categories: Category[];
  subcategories: Subcategory[];
};

export default function ProductEditForm({
  product,
  categories,
  subcategories,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [categoryId, setCategoryId] = useState(
    product.category_id ?? ""
  );
  const [subcategoryId, setSubcategoryId] = useState(
    product.subcategory_id ?? ""
  );
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(
    product.description ?? ""
  );
  const [price, setPrice] = useState(String(product.price));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product.compare_at_price == null
      ? ""
      : String(product.compare_at_price)
  );
  const [sku, setSku] = useState(product.sku ?? "");
  const [quantity, setQuantity] = useState(
    String(product.quantity)
  );
  const [isActive, setIsActive] = useState(product.is_active);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSaving(true);

    const { error: productError } = await supabase
      .from("products")
      .update({
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        price: Number(price),
        compare_at_price: compareAtPrice
          ? Number(compareAtPrice)
          : null,
        sku: sku.trim() || null,
        is_active: isActive,
      })
      .eq("id", product.id);

    if (productError) {
      setError(productError.message);
      setSaving(false);
      return;
    }

    const { error: inventoryError } = await supabase
      .from("inventory")
      .update({
        quantity: Number(quantity),
      })
      .eq("product_id", product.id);

    if (inventoryError) {
      setError(inventoryError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  const available = Math.max(
    Number(quantity) - product.reservedQuantity,
    0
  );

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
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              SKU
            </label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              onChange={(e) => setPrice(e.target.value)}
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
              onChange={(e) => setCompareAtPrice(e.target.value)}
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
              onChange={(e) => {
                setCategoryId(e.target.value);
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
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={!categoryId}
              className="w-full rounded-md border px-3 py-2 disabled:bg-gray-100"
            >
              <option value="">Select subcategory</option>

              {filteredSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <h3 className="mb-5 font-semibold">Inventory</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Quantity
            </label>

            <input
              required
              min={product.reservedQuantity}
              step="1"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Reserved
            </label>

            <div className="rounded-md border bg-gray-50 px-3 py-2">
              {product.reservedQuantity}
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Reserved stock is controlled by orders.
            </p>
          </div>
        </div>

        <div className="mt-4 text-sm">
          Available stock:{" "}
          <span className="font-semibold">{available}</span>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />

          <span className="text-sm font-medium">
            Product is active
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
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}