import { createClient } from "@/lib/supabase/server";

export type StorefrontMedia = {
  id: string;
  media_type: "image" | "video";
  title: string;
  file_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  mime_type: string | null;
  file_size: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAdminMedia() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("storefront_media")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load media: ${error.message}`);
  }

  return (data ?? []) as StorefrontMedia[];
}
