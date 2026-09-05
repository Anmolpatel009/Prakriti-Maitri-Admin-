import MediaActions from "@/components/media/MediaActions";
import type { StorefrontMedia } from "@/lib/admin/media/queries";

type Props = {
  media: StorefrontMedia;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaCard({ media }: Props) {
  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        background: "white",
      }}
    >
      <div
        style={{
          height: 220,
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {media.media_type === "video" ? (
          <video
            src={media.file_url}
            controls
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <img
            src={media.file_url}
            alt={media.alt_text || media.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </div>

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <strong>{media.title}</strong>

          <span
            style={{
              fontSize: 12,
              padding: "3px 7px",
              borderRadius: 999,
              background:
                media.media_type === "video"
                  ? "#ede9fe"
                  : "#dcfce7",
            }}
          >
            {media.media_type}
          </span>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            marginBottom: 14,
          }}
        >
          {formatSize(media.file_size)}
          {" · "}
          {media.is_active ? "Active" : "Inactive"}
        </div>

        <MediaActions
          id={media.id}
          fileUrl={media.file_url}
        />
      </div>
    </article>
  );
}
