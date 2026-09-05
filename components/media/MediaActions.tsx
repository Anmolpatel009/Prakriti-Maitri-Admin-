"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  fileUrl: string;
};

function getStoragePath(fileUrl: string) {
  const marker = "/storage/v1/object/public/storefront-media/";

  const index = fileUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    fileUrl.slice(index + marker.length)
  );
}

export default function MediaActions({ id, fileUrl }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);

    try {
      const { data: current, error: fetchError } = await supabase
        .from("storefront_media")
        .select("is_active")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const { error } = await supabase
        .from("storefront_media")
        .update({ is_active: !current.is_active })
        .eq("id", id);

      if (error) throw new Error(error.message);

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update media."
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeMedia() {
    if (
      !window.confirm(
        "Delete this media permanently? This cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const storagePath = getStoragePath(fileUrl);

      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from("storefront-media")
          .remove([storagePath]);

        if (storageError) {
          throw new Error(storageError.message);
        }
      }

      const { error } = await supabase
        .from("storefront_media")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete media."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        onClick={toggleActive}
        disabled={loading}
        style={{
          padding: "7px 10px",
          border: "1px solid #d1d5db",
          borderRadius: 7,
          background: "white",
          cursor: "pointer",
        }}
      >
        {loading ? "..." : "Toggle"}
      </button>

      <button
        type="button"
        onClick={removeMedia}
        disabled={loading}
        style={{
          padding: "7px 10px",
          border: "1px solid #fecaca",
          borderRadius: 7,
          background: "white",
          color: "#b91c1c",
          cursor: "pointer",
        }}
      >
        Delete
      </button>
    </div>
  );
}
