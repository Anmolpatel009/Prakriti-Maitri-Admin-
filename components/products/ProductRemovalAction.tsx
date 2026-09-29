"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProductImage = {
  id: string;
  image_url: string;
};

type Props = {
  productId: string;
  productName: string;
  reservedQuantity: number;
  images: ProductImage[];
};

function getStoragePath(imageUrl: string | null) {
  if (!imageUrl) return null;

  const marker =
    "/storage/v1/object/public/product-images/";

  const index = imageUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    imageUrl.slice(index + marker.length)
  );
}

export default function ProductRemovalAction({
  productId,
  productName,
  reservedQuantity,
  images,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleRemove() {
    const confirmed = window.confirm(
      `Remove "${productName}"?\n\n` +
        `• If this product has order history, it will be kept and its available stock will be set to 0.\n` +
        `• If it has no order history, it will be permanently deleted.\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      const {
        data: orderItems,
        error: orderError,
      } = await supabase
        .from("order_items")
        .select("id")
        .eq("product_id", productId)
        .limit(1);

      if (orderError) {
        throw new Error(
          `Could not check order history: ${orderError.message}`
        );
      }

      const hasOrderHistory =
        (orderItems ?? []).length > 0;

      if (hasOrderHistory) {
        const {
          data: inventory,
          error: inventoryFetchError,
        } = await supabase
          .from("inventory")
          .select("reserved_quantity")
          .eq("product_id", productId)
          .maybeSingle();

        if (inventoryFetchError) {
          throw new Error(
            `Could not load inventory: ${inventoryFetchError.message}`
          );
        }

        if (!inventory) {
          throw new Error(
            "Inventory record was not found for this product."
          );
        }

        const reserved = Math.max(
          Number(
            inventory.reserved_quantity ??
              reservedQuantity ??
              0
          ),
          0
        );

        const {
          error: inventoryUpdateError,
        } = await supabase
          .from("inventory")
          .update({
            quantity: reserved,
          })
          .eq("product_id", productId);

        if (inventoryUpdateError) {
          throw new Error(
            `Could not set product stock to zero available: ${inventoryUpdateError.message}`
          );
        }

        window.alert(
          reserved > 0
            ? `Product kept because it has order history. Available stock is now 0 and ${reserved} reserved item(s) were preserved.`
            : "Product kept because it has order history. Available stock is now 0."
        );

        router.refresh();
        return;
      }

      const storagePaths = images
        .map((image) => getStoragePath(image.image_url))
        .filter(
          (path): path is string => Boolean(path)
        );

      const {
        error: productDeleteError,
      } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (productDeleteError) {
        throw new Error(
          `Could not delete product: ${productDeleteError.message}`
        );
      }

      if (storagePaths.length > 0) {
        const {
          error: storageError,
        } = await supabase.storage
          .from("product-images")
          .remove(storagePaths);

        if (storageError) {
          window.alert(
            `Product deleted successfully, but some image files could not be removed from Storage:\n\n${storageError.message}`
          );
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Failed to remove product."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-red-200 bg-white p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-red-700">
          Remove Product
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Products with order history are preserved and their
          available stock is set to 0. Products without order
          history are permanently deleted.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleRemove}
        disabled={busy}
        className="rounded-md border border-red-300 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Removing..." : "Remove Product"}
      </button>
    </section>
  );
}
