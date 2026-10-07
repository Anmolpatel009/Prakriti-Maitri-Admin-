"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProductImageUploader from "@/components/products/ProductImageUploader";

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

type CloneProductImage = {
  image_url: string;
  alt_text: string | null;
  display_order: number | null;
};

type CloneProduct = {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  sku: string | null;
  is_active: boolean;
  minimum_order_quantity: number | null;
  inventory:
    | { quantity: number; reserved_quantity: number }
    | { quantity: number; reserved_quantity: number }[]
    | null;
  product_images: CloneProductImage[] | null;
};

type Props = {
  categories: Category[];
  subcategories: Subcategory[];
  cloneProduct?: CloneProduct | null;
};

export default function ProductForm({
  categories,
  subcategories,
  cloneProduct = null,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const cloneInventory = Array.isArray(cloneProduct?.inventory)
    ? cloneProduct.inventory[0]
    : cloneProduct?.inventory;

  const [categoryId, setCategoryId] = useState(
    cloneProduct?.category_id ?? "",
  );
  const [subcategoryId, setSubcategoryId] = useState(
    cloneProduct?.subcategory_id ?? "",
  );
  const [name, setName] = useState(
    cloneProduct ? `${cloneProduct.name} (Copy)` : "",
  );
  const [slug, setSlug] = useState(
    cloneProduct ? `${cloneProduct.slug}-copy` : "",
  );
  const [shortDescription, setShortDescription] = useState(
    cloneProduct?.short_description ?? "",
  );
  const [description, setDescription] = useState(
    cloneProduct?.description ?? "",
  );
  const [price, setPrice] = useState(
    cloneProduct ? String(cloneProduct.price) : "",
  );
  const [compareAtPrice, setCompareAtPrice] = useState(
    cloneProduct?.compare_at_price != null
      ? String(cloneProduct.compare_at_price)
      : "",
  );
  const [sku, setSku] = useState(
    cloneProduct?.sku ? `${cloneProduct.sku}-COPY` : "",
  );
  const [quantity, setQuantity] = useState(
    cloneInventory ? String(cloneInventory.quantity) : "0",
  );
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(
    cloneProduct?.minimum_order_quantity != null
      ? String(cloneProduct.minimum_order_quantity)
      : "1",
  );
  const [isActive, setIsActive] = useState(
    cloneProduct?.is_active ?? true,
  );

  const [images, setImages] = useState<File[]>([]);
  const [cloneImagesLoading, setCloneImagesLoading] = useState(
    Boolean(cloneProduct?.product_images?.length),
  );

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

  useEffect(() => {
    const sourceImages = cloneProduct?.product_images ?? [];

    if (!sourceImages?.length) {
      return;
    }

    let cancelled = false;

    async function loadCloneImages() {
      setCloneImagesLoading(true);
      setError("");

      try {
        const orderedImages = [...sourceImages]
          .sort(
            (a, b) =>
              (a.display_order ?? Number.MAX_SAFE_INTEGER) -
              (b.display_order ?? Number.MAX_SAFE_INTEGER),
          )
          .slice(0, 4);

        const files = await Promise.all(
          orderedImages.map(async (image, index) => {
            const response = await fetch(image.image_url);

            if (!response.ok) {
              throw new Error(
                `Failed to load clone image ${index + 1}.`,
              );
            }

            const blob = await response.blob();
            const allowedTypes = [
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
            ];

            if (!allowedTypes.includes(blob.type)) {
              throw new Error(
                `Clone image ${index + 1} has an unsupported format.`,
              );
            }

            if (blob.size > 5 * 1024 * 1024) {
              throw new Error(
                `Clone image ${index + 1} is larger than 5MB.`,
              );
            }

            const extension =
              blob.type === "image/png"
                ? "png"
                : blob.type === "image/webp"
                  ? "webp"
                  : blob.type === "image/gif"
                    ? "gif"
                    : "jpg";

            return new File(
              [blob],
              `clone-image-${index + 1}.${extension}`,
              { type: blob.type },
            );
          }),
        );

        if (!cancelled) {
          setImages(files);
        }
      } catch (cloneImageError) {
        if (!cancelled) {
          setImages([]);
          setError(
            cloneImageError instanceof Error
              ? cloneImageError.message
              : "Failed to load the source product images.",
          );
        }
      } finally {
        if (!cancelled) {
          setCloneImagesLoading(false);
        }
      }
    }

    loadCloneImages();

    return () => {
      cancelled = true;
    };
  }, [cloneProduct]);

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

    if (cloneProduct?.product_images?.length && cloneImagesLoading) {
      setError("Clone images are still loading.");
      return;
    }

    if (
      cloneProduct?.product_images?.length &&
      images.length === 0
    ) {
      setError("The source product images could not be loaded.");
      return;
    }

    setError("");
    setSaving(true);

    const minimumOrderQuantityValue = Number(minimumOrderQuantity);

    if (
      !Number.isInteger(minimumOrderQuantityValue) ||
      minimumOrderQuantityValue < 1
    ) {
      setError("MOQ must be a whole number of at least 1.");
      setSaving(false);
      return;
    }

    /*
     * STEP 1
     * Create the product and inventory.
     *
     * The RPC returns the newly created product UUID.
     */
    const { data: productId, error: productError } =
      await supabase.rpc("create_product_with_inventory_with_short_description", {
        p_category_id: categoryId || null,
        p_subcategory_id: subcategoryId || null,
        p_name: name.trim(),
        p_slug: slug.trim(),
        p_description: description.trim() || null,
        p_short_description: shortDescription.trim() || null,
        p_price: Number(price),
        p_compare_at_price: compareAtPrice
          ? Number(compareAtPrice)
          : null,
        p_sku: sku.trim(),
        p_is_active: isActive,
        p_quantity: Number(quantity),
      });

    if (productError) {
      setError(productError.message);
      setSaving(false);
      return;
    }

    if (!productId) {
      setError("Product could not be created.");
      setSaving(false);
      return;
    }

    const { error: minimumOrderQuantityError } = await supabase
      .from("products")
      .update({
        minimum_order_quantity: minimumOrderQuantityValue,
      })
      .eq("id", productId);

    if (minimumOrderQuantityError) {
      setError(
        `Product was created, but MOQ could not be saved: ${minimumOrderQuantityError.message}`
      );
      setSaving(false);
      return;
    }

    /*
     * STEP 2
     * Upload product images.
     */
    const uploadedFiles: string[] = [];

    try {
      for (let index = 0; index < images.length; index++) {
        const file = images[index];

        const extension =
          file.name.split(".").pop()?.toLowerCase() || "jpg";

        const fileName = `${crypto.randomUUID()}.${extension}`;

        const filePath = `products/${productId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(
            `Failed to upload ${file.name}: ${uploadError.message}`
          );
        }

        uploadedFiles.push(filePath);

        /*
         * STEP 3
         * Generate the public URL for the uploaded image.
         */
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        /*
         * STEP 4
         * Save image metadata in product_images.
         */
        const { error: imageRecordError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: publicUrl,
            alt_text: name.trim(),
            display_order: index,
          });

        if (imageRecordError) {
          throw new Error(
            `Failed to save image information: ${imageRecordError.message}`
          );
        }
      }
    } catch (imageError) {
      /*
       * STEP 5
       * If an image operation fails, remove files that were
       * already uploaded during this submission.
       */
      if (uploadedFiles.length > 0) {
        await supabase.storage
          .from("product-images")
          .remove(uploadedFiles);
      }

      /*
       * Remove image database records that may have been
       * created before the failure.
       */
      await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);

      setError(
        imageError instanceof Error
          ? imageError.message
          : "Failed to upload product images."
      );

      setSaving(false);
      return;
    }

    /*
     * STEP 6
     * Everything succeeded.
     */
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {/* Product Information */}
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
              Short description
            </label>

            <textarea
              rows={3}
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="A concise customer-facing summary shown near the product title."
            />

            <p className="mt-1 text-xs text-gray-500">
              Recommended: 120–180 characters.
            </p>
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

      {/* Pricing */}
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

      {/* Category */}
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

      {/* Product Images */}
      {cloneProduct && cloneImagesLoading && (
        <p className="mb-3 text-sm text-gray-500">
          Loading images from the source product...
        </p>
      )}

      <ProductImageUploader
        value={images}
        onChange={setImages}
        disabled={saving}
      />

      {/* Inventory */}
      <section className="rounded-lg border bg-white p-6">
        <h3 className="mb-5 font-semibold">Inventory</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
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

          <div>
            <label className="mb-1 block text-sm font-medium">
              Minimum Order Quantity (MOQ)
            </label>

            <input
              required
              min="1"
              step="1"
              type="number"
              value={minimumOrderQuantity}
              onChange={(event) =>
                setMinimumOrderQuantity(event.target.value)
              }
              placeholder="Enter minimum order quantity"
              className="w-full rounded-md border px-3 py-2"
            />

            <p className="mt-1 text-xs text-gray-500">
              Customers cannot order less than this quantity.
            </p>
          </div>
        </div>
      </section>

      {/* Active Status */}
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

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
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
          {saving
              ? "Creating..."
              : cloneProduct
                ? "Clone Product"
                : "Create Product"}
        </button>
      </div>
    </form>
  );
}