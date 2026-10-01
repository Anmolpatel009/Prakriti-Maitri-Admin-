import { createClient } from "@/lib/supabase/server";

export const PRODUCT_CARD_STYLING_KEY = "product_card_styling";

export type ProductCardStylingConfig = {
  font_family: string;
  font_size: number;
  text_color: string;
  card_color: string;
  animation: "fade-in" | "slide-up" | "scale-in";
};

export const defaultProductCardStylingConfig: ProductCardStylingConfig = {
  font_family: "system-ui, sans-serif",
  font_size: 16,
  text_color: "#3D3D3D",
  card_color: "#FFFDF9",
  animation: "fade-in",
};

export async function getProductCardStyling(): Promise<ProductCardStylingConfig> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("homepage_sections")
    .select("description")
    .eq("section_key", PRODUCT_CARD_STYLING_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product card styling: ${error.message}`);
  }

  if (!data?.description) {
    return defaultProductCardStylingConfig;
  }

  try {
    const parsed = JSON.parse(data.description) as Record<string, unknown>;

    const fontSize = Number(parsed.font_size);

    const animation =
      parsed.animation === "slide-up" ||
      parsed.animation === "scale-in"
        ? parsed.animation
        : "fade-in";

    return {
      font_family:
        typeof parsed.font_family === "string" &&
        parsed.font_family.trim()
          ? parsed.font_family
          : defaultProductCardStylingConfig.font_family,

      font_size:
        Number.isFinite(fontSize) && fontSize >= 12 && fontSize <= 32
          ? fontSize
          : defaultProductCardStylingConfig.font_size,

      text_color:
        typeof parsed.text_color === "string" &&
        parsed.text_color.trim()
          ? parsed.text_color
          : defaultProductCardStylingConfig.text_color,

      card_color:
        typeof parsed.card_color === "string" &&
        parsed.card_color.trim()
          ? parsed.card_color
          : defaultProductCardStylingConfig.card_color,

      animation,
    };
  } catch {
    return defaultProductCardStylingConfig;
  }
}
