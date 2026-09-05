"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  id: string;
  isActive: boolean;
  imageUrl: string | null;
};

function getStoragePath(imageUrl: string | null) {
  if (!imageUrl) return null;

  const marker = "/storage/v1/object/public/product-images/";

  const index = imageUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    imageUrl.slice(index + marker.length)
  );
}

export default function StorefrontNavCardActions({
  id,
  isActive,
  imageUrl,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);

    const { error } = await supabase
      .from("storefront_nav_cards")
      .update({
        is_active: !isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    setBusy(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.refresh();
  }

  async function deleteCard() {
    const confirmed = window.confirm(
      "Delete this storefront card? This cannot be undone."
    );

    if (!confirmed) return;

    setBusy(true);

    try {
      const storagePath = getStoragePath(imageUrl);

      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove([storagePath]);

        if (storageError) {
          throw new Error(
            `Failed to remove card image: ${storageError.message}`
          );
        }
      }

      const { error } = await supabase
        .from("storefront_nav_cards")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete storefront card."
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={toggleActive}
        disabled={busy}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>

      <button
        type="button"
        onClick={deleteCard}
        disabled={busy}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
