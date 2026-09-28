"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type CategoryBanner = {
  id: string;
  category_id: string;
  image_url: string;
  alt_text: string | null;
  is_active: boolean;
};

type Props = {
  category: Category;
  banner?: CategoryBanner;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function getStoragePath(fileUrl: string) {
  const marker = "/storage/v1/object/public/storefront-media/";
  const index = fileUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    fileUrl.slice(index + marker.length)
  );
}

function getExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  return "webp";
}

export default function CategoryBannerEditor({
  category,
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
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setMessage("Please upload JPG, PNG or WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setMessage("Image must be smaller than 5MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const path =
        `categories/banners/${category.slug}/${Date.now()}.${getExtension(file)}`;

      const { error: uploadError } = await supabase.storage
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

      const { error: dbError } = await supabase
        .from("category_banners")
        .upsert(
          {
            ...(banner?.id ? { id: banner.id } : {}),
            category_id: category.id,
            image_url: publicUrl,
            alt_text: altText || null,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "category_id",
          }
        );

      if (dbError) {
        await supabase.storage
          .from("storefront-media")
          .remove([path]);

        throw dbError;
      }

      if (banner?.image_url) {
        const oldPath = getStoragePath(banner.image_url);

        if (oldPath && oldPath !== path) {
          await supabase.storage
            .from("storefront-media")
            .remove([oldPath]);
        }
      }

      setImageUrl(publicUrl);
      setMessage("Category banner uploaded successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload category banner."
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
          "Upload a category banner image before saving."
        );
      }

      const { error } = await supabase
        .from("category_banners")
        .upsert(
          {
            ...(banner?.id ? { id: banner.id } : {}),
            category_id: category.id,
            image_url: imageUrl,
            alt_text: altText || null,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "category_id",
          }
        );

      if (error) {
        throw error;
      }

      setMessage("Category banner changes saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save category banner."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!banner?.id || !imageUrl) return;

    if (
      !window.confirm(
        `Remove the ${category.name} banner? This cannot be undone.`
      )
    ) {
      return;
    }

    setRemoving(true);
    setMessage("");

    try {
      const storagePath = getStoragePath(imageUrl);

      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from("storefront-media")
          .remove([storagePath]);

        if (storageError) {
          throw storageError;
        }
      }

      const { error } = await supabase
        .from("category_banners")
        .delete()
        .eq("id", banner.id);

      if (error) {
        throw error;
      }

      setImageUrl("");
      setAltText("");
      setIsActive(true);
      setMessage("Category banner removed successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to remove category banner."
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#fff",
        padding: 24,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#6b7280",
          }}
        >
          Category Banner
        </p>

        <h3
          style={{
            margin: 0,
            fontSize: 22,
          }}
        >
          {category.name}
        </h3>

        <p
          style={{
            margin: "8px 0 0",
            color: "#666",
            lineHeight: 1.5,
          }}
        >
          This banner is shared by the Shop homepage and the
          {` ${category.name}`} collection page.
        </p>
      </div>

      {imageUrl && (
        <div
          style={{
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            background: "#f9f7f2",
            marginBottom: 20,
          }}
        >
          <img
            src={imageUrl}
            alt={altText || `${category.name} banner`}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />
        </div>
      )}

      <div
        style={{
          marginBottom: 20,
          padding: 14,
          border: "1px solid rgba(210,180,140,.4)",
          background: "#f9f7f2",
        }}
      >
        <strong
          style={{
            display: "block",
            marginBottom: 5,
            fontSize: 14,
          }}
        >
          Recommended banner size
        </strong>

        <span
          style={{
            display: "block",
            fontSize: 14,
            color: "#4b5563",
          }}
        >
          1920 × 650 px
        </span>

        <span
          style={{
            display: "block",
            marginTop: 4,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          JPG, PNG or WebP · Maximum 5MB
        </span>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label
          htmlFor={`category-banner-file-${category.id}`}
          style={{
            display: "block",
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Upload / Replace Banner
        </label>

        <input
          id={`category-banner-file-${category.id}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={uploading || saving || removing}
        />

        {uploading && (
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              marginBottom: 0,
            }}
          >
            Uploading banner...
          </p>
        )}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label
          htmlFor={`category-banner-alt-${category.id}`}
          style={{
            display: "block",
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Alt text
        </label>

        <input
          id={`category-banner-alt-${category.id}`}
          type="text"
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          placeholder={`${category.name} banner`}
          style={{
            width: "100%",
            padding: "9px 11px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
          }}
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
          fontSize: 14,
        }}
      >
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          disabled={uploading || saving || removing}
        />
        Banner is active
      </label>

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
          disabled={saving || uploading || removing}
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
            disabled={saving || uploading || removing}
            style={{
              padding: "9px 15px",
              border: "1px solid #fecaca",
              borderRadius: 7,
              background: "#fff",
              color: "#b91c1c",
              cursor: "pointer",
            }}
          >
            {removing ? "Removing..." : "Remove Banner"}
          </button>
        )}
      </div>

      {message && (
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 14,
            color: message.toLowerCase().includes("success")
              ? "#166534"
              : "#b91c1c",
          }}
        >
          {message}
        </p>
      )}
    </article>
  );
}
