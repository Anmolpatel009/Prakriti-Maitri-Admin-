import MediaUploader from "@/components/media/MediaUploader";
import MediaCard from "@/components/media/MediaCard";
import { getAdminMedia } from "@/lib/admin/media/queries";

export default async function MediaPage() {
  const media = await getAdminMedia();

  return (
    <main style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Media
        </h1>

        <p style={{ color: "#6b7280" }}>
          Manage images and advertising videos used by the
          storefront.
        </p>
      </div>

      <MediaUploader />

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>
            Media Library
          </h2>

          <span style={{ color: "#6b7280", fontSize: 14 }}>
            {media.length} item{media.length === 1 ? "" : "s"}
          </span>
        </div>

        {media.length === 0 ? (
          <div
            style={{
              border: "1px dashed #d1d5db",
              borderRadius: 12,
              padding: 48,
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            No media uploaded yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {media.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
