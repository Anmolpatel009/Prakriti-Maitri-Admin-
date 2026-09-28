import HomepageSectionEditor from "@/components/homepage/HomepageSectionEditor";
import HomepagePromotionalBanners from "@/components/homepage-banners/HomepagePromotionalBanners";
import CollectionBannerEditor from "@/components/collection-banners/CollectionBannerEditor";
import CategoryBannerEditor from "@/components/collection-banners/CategoryBannerEditor";
import { getHomepageSections } from "@/lib/admin/homepage/queries";
import {
  getAdminCollectionBanners,
  getAdminCategoryBanners,
} from "@/lib/admin/collection-banners/queries";

export default async function AdminHomepagePage() {
  const [sections, banners, categoryBanners] = await Promise.all([
    getHomepageSections(),
    getAdminCollectionBanners(),
    getAdminCategoryBanners(),
  ]);

  const editableKeys = [
    "hero",
    "purpose_banner",
    "gifting_banner",
    "story_banner",
  ];

  const editableSections = sections.filter((section) =>
    editableKeys.includes(section.section_key)
  );

  const bannerBySlot = new Map(
    banners.map((banner) => [banner.slot, banner])
  );

  const categoryBannerById = new Map(
    categoryBanners.map((banner) => [banner.category_id, banner])
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
          Manage the homepage hero, promotional banners, story
          image and collection page banners without changing the
          storefront code.
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
        <p>No editable homepage sections were found.</p>
      )}

      <section style={{ marginTop: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Collections Page CMS
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Collection Page Banners
          </h2>

          <p
            style={{
              maxWidth: 760,
              color: "#666",
              lineHeight: 1.6,
              marginTop: 8,
            }}
          >
            Manage the four rotating banners displayed at the top
            of the Collections page. Empty slots will not appear
            on the storefront.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 24,
          }}
        >
          {[1, 2, 3, 4].map((slot) => (
            <CollectionBannerEditor
              key={slot}
              slot={slot}
              banner={bannerBySlot.get(slot)}
            />
          ))}
        </div>
      </section>
      <section style={{ marginTop: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Storefront Category CMS
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Category Banners
          </h2>

          <p
            style={{
              maxWidth: 760,
              color: "#666",
              lineHeight: 1.6,
              marginTop: 8,
            }}
          >
            Manage the banners shared by the Shop homepage and
            their corresponding category pages.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 24,
          }}
        >
          {[
            {
              id: "8bd95067-7374-45b4-9df4-d25aa03df3e3",
              name: "Laptop Bags & Sleeves",
              slug: "hand-bags",
            },
            {
              id: "570f3633-51d7-4a1c-b39b-8ef25216db03",
              name: "Hamper Bags",
              slug: "hamper-bags",
            },
            {
              id: "f547841f-a2b8-4445-b6ee-491f742459ec",
              name: "Brands Packaging Bags",
              slug: "packaging-bags",
            },
          ].map((category) => (
            <CategoryBannerEditor
              key={category.id}
              category={category}
              banner={categoryBannerById.get(category.id)}
            />
          ))}
        </div>
      </section>

      <HomepagePromotionalBanners />

    </main>
  );
}
