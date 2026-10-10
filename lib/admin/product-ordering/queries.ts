import { createClient } from "@/lib/supabase/server";

export const MERCHANDISING_KEY = "homepage_merchandising";

export type MerchandisingConfig = {
  collectionCards: Array<{
    slot: number;
    collection_type: "category" | "subcategory";
    category_id: string | null;
    subcategory_id: string | null;
    heading: string;
    subheading: string;
    font_family: "serif" | "sans" | "mono";
    font_size: "small" | "medium" | "large" | "xlarge";
    font_style: "normal" | "italic";
    font_weight: "400" | "500" | "600" | "700";
    text_color: string;
    background_color: string;
  }>;
  newArrivals: string[];
};

export const defaultMerchandisingConfig: MerchandisingConfig = {
  collectionCards: [1, 2, 3, 4, 5, 6].map((slot) => ({
    slot,
    collection_type: "category",
    category_id: null,
    subcategory_id: null,
    heading: "",
    subheading: "",
    font_family: "serif",
    font_size: "large",
    font_style: "normal",
    font_weight: "600",
    text_color: "#111111",
    background_color: "#F3F0E7",
  })),
  newArrivals: [],
};

export async function getProductOrderingData() {
  const supabase = await createClient();

  const [productsResult, categoriesResult, subcategoriesResult, configResult] =
    await Promise.all([
      supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          sku,
          category_id,
          subcategory_id,
          is_active,
          display_order,
          product_images (
            image_url,
            alt_text,
            display_order
          )
        `)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),

      supabase
        .from("categories")
        .select("id, name, slug, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),

      supabase
        .from("subcategories")
        .select("id, category_id, name, slug, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),

      supabase
        .from("homepage_sections")
        .select("id, description")
        .eq("section_key", MERCHANDISING_KEY)
        .maybeSingle(),
    ]);

  if (productsResult.error) throw new Error(productsResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (subcategoriesResult.error) {
    throw new Error(subcategoriesResult.error.message);
  }
  if (configResult.error) throw new Error(configResult.error.message);

  let config = defaultMerchandisingConfig;

  if (configResult.data?.description) {
    try {
      const parsed = JSON.parse(configResult.data.description);
      config = {
        collectionCards: Array.isArray(parsed.collectionCards)
          ? parsed.collectionCards
          : defaultMerchandisingConfig.collectionCards,
        newArrivals: Array.isArray(parsed.newArrivals)
          ? parsed.newArrivals.filter(
              (id: unknown): id is string => typeof id === "string"
            )
          : [],
      };
    } catch {
      // Keep defaults when legacy/invalid config is encountered.
    }
  }

  return {
    products: productsResult.data ?? [],
    categories: categoriesResult.data ?? [],
    subcategories: subcategoriesResult.data ?? [],
    config,
  };
}
