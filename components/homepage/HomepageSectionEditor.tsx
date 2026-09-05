"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type HomepageSection = {
  id: string;
  section_key: string;
  section_type: string;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  cta_text: string | null;
  cta_url: string | null;
  is_active: boolean;
  media_url: string | null;
};

type Props = {
  section: HomepageSection;
};

export default function HomepageSectionEditor({ section }: Props) {
  const supabase = createClient();

  const [eyebrow, setEyebrow] = useState(section.eyebrow ?? "");
  const [title, setTitle] = useState(section.title ?? "");
  const [description, setDescription] = useState(section.description ?? "");
  const [ctaText, setCtaText] = useState(section.cta_text ?? "");
  const [ctaUrl, setCtaUrl] = useState(section.cta_url ?? "");
  const [isActive, setIsActive] = useState(section.is_active);
  const [mediaUrl, setMediaUrl] = useState(section.media_url);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload JPG, PNG, WebP or GIF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `homepage/${section.id}/${Date.now()}.${extension}`;

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

      const { data: media, error: mediaError } = await supabase
        .from("storefront_media")
        .insert({
          media_type: "image",
          title: section.title || section.section_key,
          file_url: publicUrl,
          alt_text: section.title || section.section_key,
          mime_type: file.type,
          file_size: file.size,
          is_active: true,
        })
        .select("id")
        .single();

      if (mediaError) {
        throw mediaError;
      }

      const { error: sectionError } = await supabase
        .from("homepage_sections")
        .update({
          media_id: media.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id);

      if (sectionError) {
        throw sectionError;
      }

      setMediaUrl(publicUrl);
      setMessage("Image uploaded successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload image.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          eyebrow: eyebrow || null,
          title: title || null,
          description: description || null,
          cta_text: ctaText || null,
          cta_url: ctaUrl || null,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id);

      if (error) {
        throw error;
      }

      setMessage("Changes saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "24px",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
            {section.title || section.section_key}
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            {section.section_key}
          </p>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
          }}
        >
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Active
        </label>
      </div>

      {mediaUrl && (
        <div style={{ marginBottom: "20px" }}>
          <img
            src={mediaUrl}
            alt={section.title || section.section_key}
            style={{
              width: "100%",
              maxHeight: "320px",
              objectFit: "cover",
              borderRadius: "8px",
              display: "block",
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor={`media-${section.id}`}
          style={{
            display: "block",
            fontWeight: 500,
            marginBottom: "8px",
          }}
        >
          Hero / Banner Image
        </label>

        <input
          id={`media-${section.id}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          disabled={uploading}
        />

        {uploading && (
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Uploading image...
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gap: "16px",
        }}
      >
        <label>
          <span style={{ display: "block", marginBottom: "6px" }}>
            Eyebrow
          </span>

          <input
            value={eyebrow}
            onChange={(event) => setEyebrow(event.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
        </label>

        <label>
          <span style={{ display: "block", marginBottom: "6px" }}>
            Title
          </span>

          <textarea
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            rows={2}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
        </label>

        <label>
          <span style={{ display: "block", marginBottom: "6px" }}>
            Description
          </span>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
        </label>

        <label>
          <span style={{ display: "block", marginBottom: "6px" }}>
            CTA Text
          </span>

          <input
            value={ctaText}
            onChange={(event) => setCtaText(event.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
        </label>

        <label>
          <span style={{ display: "block", marginBottom: "6px" }}>
            CTA URL
          </span>

          <input
            value={ctaUrl}
            onChange={(event) => setCtaUrl(event.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
        </label>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "20px",
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          style={{
            padding: "10px 18px",
            borderRadius: "6px",
            border: "none",
            cursor: saving || uploading ? "not-allowed" : "pointer",
            background: "#111827",
            color: "#fff",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {message && (
          <span style={{ fontSize: "14px", color: "#4b5563" }}>
            {message}
          </span>
        )}
      </div>
    </section>
  );
}
