import { createClient } from "@/lib/supabase/server";

export type StorefrontNavCard = {
  id: string;
  card_type: "category" | "subcategory" | "product" | "custom";
  category_id: string | null;
  subcategory_id: string | null;
  product_id: string | null;
  title: string;
  image_url: string | null;
  href: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export async function getAdminStorefrontNavCards() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("storefront_nav_cards")
    .select(`
      id,
      card_type,
      category_id,
      subcategory_id,
      product_id,
      title,
      image_url,
      href,
      is_active,
      display_order,
      created_at,
      updated_at
    `)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load storefront navigation cards: ${error.message}`
    );
  }

  return (data ?? []) as StorefrontNavCard[];
}
