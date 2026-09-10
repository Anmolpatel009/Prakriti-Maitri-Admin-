"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type HomepageBanner = {
  id: string;
  slot: number;
  image_url: string;
  alt_text: string | null;
  is_active: boolean;
};

type Props = {
  slot: number;
  banner?: HomepageBanner;
};

function getStoragePath(fileUrl: string) {
  const marker = "/storage/v1/object/public/storefront-media/";
  const index = fileUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    fileUrl.slice(index + marker.length)
  );
}

export default function HomepageBannerEditor({
  slot,
  banner,
}: Props) {
  const supabase = createClient();

  const [imageUrl, setImageUrl] = useState(
    banner?.image_url ?? ""
  );
  const [altText, setAltText] = useState(
    banner?.alt_text ?? ""
  );
  const [isActive, setIsActive] = useState(
    banner?.is_active ?? true
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload JPG, PNG or WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const path =
        `homepage/banners/slot-${slot}/${Date.now()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("storefront-media")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("storefront-media")
        .getPublicUrl(path);

      const { error: dbError } =
        await supabase
          .from("homepage_banners")
          .upsert(
            {
              ...(banner?.id ? { id: banner.id } : {}),
              slot,
              image_url: publicUrl,
              alt_text: altText || null,
              is_active: isActive,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "slot",
            }
          );

      if (dbError) {
        await supabase.storage
          .from("storefront-media")
          .remove([path]);

        throw dbError;
      }

      if (banner?.image_url) {
        const oldPath = getStoragePath(
          banner.image_url
        );

        if (oldPath && oldPath !== path) {
          await supabase.storage
            .from("storefront-media")
            .remove([oldPath]);
        }
      }

      setImageUrl(publicUrl);
      setMessage("Banner uploaded successfully.");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload banner."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      if (!imageUrl) {
        throw new Error(
          "Upload a banner image before saving."
        );
      }

      const { error } = await supabase
        .from("homepage_banners")
        .upsert(
          {
            ...(banner?.id ? { id: banner.id } : {}),
            slot,
            image_url: imageUrl,
            alt_text: altText || null,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "slot",
          }
        );

      if (error) {
        throw error;
      }

      setMessage("Changes saved successfully.");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!banner?.id || !imageUrl) return;

    if (
      !window.confirm(
        `Remove Homepage Promotional Banner ${slot}? This cannot be undone.`
      )
    ) {
      return;
    }

    setRemoving(true);
    setMessage("");

    try {
      const storagePath =
        getStoragePath(imageUrl);

      if (storagePath) {
        const { error: storageError } =
          await supabase.storage
            .from("storefront-media")
            .remove([storagePath]);

        if (storageError) {
          throw storageError;
        }
      }

      const { error } =
        await supabase
          .from("homepage_banners")
          .delete()
          .eq("id", banner.id);

      if (error) {
        throw error;
      }

      setImageUrl("");
      setAltText("");
      setIsActive(true);

      setMessage("Banner removed successfully.");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to remove banner."
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Promotional Banner {slot}
          </h3>

          <p
            style={{
              margin: "5px 0 0",
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            Display slot {slot} on the homepage carousel.
          </p>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
          }}
        >
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

      {imageUrl && (
        <div style={{ marginBottom: 20 }}>
          <img
            src={imageUrl}
            alt={
              altText ||
              `Homepage Promotional Banner ${slot}`
            }
            style={{
              width: "100%",
              aspectRatio: "3.6 / 1",
              objectFit: "cover",
              borderRadius: 8,
              display: "block",
              background: "#f3f4f6",
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <label
          htmlFor={`homepage-banner-file-${slot}`}
          style={{
            display: "block",
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Upload / Replace Banner
        </label>

        <input
          id={`homepage-banner-file-${slot}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={uploading || removing}
        />

        {uploading && (
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            Uploading banner...
          </p>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label
          htmlFor={`homepage-banner-alt-${slot}`}
          style={{
            display: "block",
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Alt Text
        </label>

        <input
          id={`homepage-banner-alt-${slot}`}
          value={altText}
          onChange={(event) =>
            setAltText(event.target.value)
          }
          placeholder={`Homepage Promotional Banner ${slot}`}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={
            saving || uploading || removing
          }
          style={{
            padding: "9px 15px",
            border: 0,
            borderRadius: 7,
            background: "#166534",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {banner?.id && imageUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={
              saving || uploading || removing
            }
            style={{
              padding: "9px 15px",
              border: "1px solid #fecaca",
              borderRadius: 7,
              background: "#fff",
              color: "#b91c1c",
              cursor: "pointer",
            }}
          >
            {removing ? "Removing..." : "Delete Banner"}
          </button>
        )}

        {message && (
          <span
            style={{
              alignSelf: "center",
              fontSize: 14,
              color: "#4b5563",
            }}
          >
            {message}
          </span>
        )}
      </div>
    </section>
  );
}
