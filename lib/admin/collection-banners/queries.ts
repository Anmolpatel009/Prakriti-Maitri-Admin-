import { createClient } from "@/lib/supabase/server";

export type CollectionBanner = {
  id: string;
  slot: number;
  image_url: string;
  alt_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAdminCollectionBanners(): Promise<CollectionBanner[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("collection_banners")
    .select(
      "id, slot, image_url, alt_text, is_active, created_at, updated_at"
    )
    .order("slot", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load collection banners: ${error.message}`
    );
  }

  return (data ?? []) as CollectionBanner[];
}
