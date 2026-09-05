import { createClient } from "@/lib/supabase/server";

export type HomepageSection = {
  id: string;
  section_key: string;
  section_type: string;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  cta_text: string | null;
  cta_url: string | null;
  display_order: number;
  is_active: boolean;
  media_url: string | null;
};

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const supabase = await createClient();

  const { data: sections, error } = await supabase
    .from("homepage_sections")
    .select(
      "id, section_key, section_type, eyebrow, title, description, cta_text, cta_url, display_order, is_active, media_id",
    )
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load homepage sections: ${error.message}`);
  }

  if (!sections?.length) {
    return [];
  }

  const mediaIds = sections
    .map((section) => section.media_id)
    .filter((id): id is string => Boolean(id));

  const mediaById = new Map<string, string>();

  if (mediaIds.length > 0) {
    const { data: media, error: mediaError } = await supabase
      .from("storefront_media")
      .select("id, file_url")
      .in("id", mediaIds)
      .eq("media_type", "image")
      .eq("is_active", true);

    if (mediaError) {
      throw new Error(
        `Failed to load homepage media: ${mediaError.message}`,
      );
    }

    for (const item of media ?? []) {
      mediaById.set(item.id, item.file_url);
    }
  }

  return sections.map((section) => ({
    id: section.id,
    section_key: section.section_key,
    section_type: section.section_type,
    eyebrow: section.eyebrow,
    title: section.title,
    description: section.description,
    cta_text: section.cta_text,
    cta_url: section.cta_url,
    display_order: section.display_order,
    is_active: section.is_active,
    media_url: section.media_id
      ? mediaById.get(section.media_id) ?? null
      : null,
  }));
}
