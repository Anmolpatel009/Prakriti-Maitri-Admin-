"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export default function MediaUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  function handleFileChange(selected: File | undefined) {
    if (!selected) return;

    const isImage = IMAGE_TYPES.includes(selected.type);
    const isVideo = VIDEO_TYPES.includes(selected.type);

    if (!isImage && !isVideo) {
      setMessage("Unsupported file type.");
      return;
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

    if (selected.size > maxSize) {
      setMessage(
        isImage
          ? "Images must be 5MB or smaller."
          : "Videos must be 100MB or smaller."
      );
      return;
    }

    setFile(selected);
    setMessage("");
  }

  async function handleUpload() {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a title.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const mediaType = file.type.startsWith("video/")
        ? "video"
        : "image";

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "bin";

      const safeName =
        file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-_]/g, "-")
          .slice(0, 80) || "media";

      const path = `homepage/${mediaType}/${Date.now()}-${safeName}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("storefront-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("storefront-media")
        .getPublicUrl(path);

      const fileUrl = publicUrlData.publicUrl;

      const { error: insertError } = await supabase
        .from("storefront_media")
        .insert({
          media_type: mediaType,
          title: title.trim(),
          file_url: fileUrl,
          alt_text: altText.trim() || null,
          mime_type: file.type,
          file_size: file.size,
          is_active: true,
        });

      if (insertError) {
        await supabase.storage
          .from("storefront-media")
          .remove([path]);

        throw new Error(insertError.message);
      }

      setTitle("");
      setAltText("");
      setFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      setMessage("Media uploaded successfully.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload media."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        marginBottom: 32,
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
        Upload Media
      </h2>

      <div style={{ display: "grid", gap: 16 }}>
        <label>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Title</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Homepage advertising video"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
            }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>
            Alt text
          </div>
          <input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
            }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>
            Image or Video
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Images: JPG, PNG, WebP, GIF up to 5MB.
            <br />
            Videos: MP4, WebM, MOV up to 100MB.
          </div>
        </label>

        {file && (
          <div
            style={{
              padding: 12,
              background: "#f9fafb",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <strong>Selected:</strong> {file.name}
            <br />
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          style={{
            padding: "11px 18px",
            borderRadius: 8,
            border: 0,
            cursor: isUploading ? "not-allowed" : "pointer",
            background: "#111827",
            color: "white",
            fontWeight: 600,
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {isUploading ? "Uploading..." : "Upload Media"}
        </button>

        {message && (
          <div
            style={{
              fontSize: 14,
              color: message.includes("successfully")
                ? "#166534"
                : "#b91c1c",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
