import HomepageBannerEditor from "@/components/homepage-banners/HomepageBannerEditor";
import { createClient } from "@/lib/supabase/server";

export default async function HomepagePromotionalBanners() {
  const supabase = await createClient();

  const { data: banners } = await supabase
    .from("homepage_banners")
    .select("id, slot, image_url, alt_text, destination_url, is_active")
    .order("slot", { ascending: true });

  const bannerMap = new Map(
    (banners ?? []).map((banner) => [banner.slot, banner])
  );

  return (
    <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Homepage Promotional Banners</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload up to 4 banners. Active banners automatically appear and rotate
          on the storefront homepage.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((slot) => (
          <HomepageBannerEditor
            key={slot}
            slot={slot}
            banner={bannerMap.get(slot)}
          />
        ))}
      </div>
    </section>
  );
}
