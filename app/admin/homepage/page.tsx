import HomepageSectionEditor from "@/components/homepage/HomepageSectionEditor";
import { getHomepageSections } from "@/lib/admin/homepage/queries";

export default async function AdminHomepagePage() {
  const sections = await getHomepageSections();

  const editableKeys = [
    "hero",
    "purpose_banner",
    "gifting_banner",
    "story_banner",
  ];

  const editableSections = sections.filter((section) =>
    editableKeys.includes(section.section_key)
  );

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 24px 80px",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          Homepage CMS
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: 34,
          }}
        >
          Hero & Banner Sections
        </h1>

        <p
          style={{
            maxWidth: 700,
            color: "#666",
            lineHeight: 1.6,
          }}
        >
          Manage the homepage hero, promotional banners and
          story image without changing the storefront code.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: 24,
        }}
      >
        {editableSections.map((section) => (
          <HomepageSectionEditor
            key={section.id}
            section={section}
          />
        ))}
      </div>

      {editableSections.length === 0 && (
        <p>
          No editable homepage sections were found.
        </p>
      )}
    </main>
  );
}
