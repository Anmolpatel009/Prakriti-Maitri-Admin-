import { createClient } from "@/lib/supabase/server";

export const NAVBAR_CUSTOMIZATION_KEY = "navbar_customization";

export type NavbarItemType =
  | "link"
  | "category"
  | "subcategory"
  | "bulk_orders";

export type NavbarItem = {
  key: string;
  type: NavbarItemType;
  id?: string;
  label?: string;
  href?: string;
};

export type NavbarCustomizationConfig = {
  brand_font_family: string;
  brand_font_size: number;
  brand_font_weight: string;
  brand_font_style: string;
  brand_text_color: string;
  background_color: string;
  items: NavbarItem[];
};

export const DEFAULT_NAVBAR_CUSTOMIZATION: NavbarCustomizationConfig = {
  brand_font_family: "Georgia, serif",
  brand_font_size: 28,
  brand_font_weight: "500",
  brand_font_style: "normal",
  brand_text_color: "#176B78",
  background_color: "#F9F7F2",
  items: [
    {
      key: "new",
      type: "link",
      label: "NEW",
      href: "/shop?category=new",
    },
    {
      key: "reviews",
      type: "link",
      label: "REVIEWS",
      href: "/reviews",
    },
    {
      key: "bulk_orders",
      type: "bulk_orders",
      label: "BULK ORDERS",
      href: "/bulk-order",
    },
  ],
};

function normalizeItems(
  items: unknown,
  fallbackItems: NavbarItem[],
): NavbarItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return fallbackItems;
  }

  return items
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item, index): NavbarItem | null => {
      const type = item.type;

      if (type === "new") {
        return {
          key: String(item.key ?? "new"),
          type: "link",
          label:
            typeof item.label === "string"
              ? item.label
              : "NEW",
          href:
            typeof item.href === "string"
              ? item.href
              : "/shop?category=new",
        };
      }

      if (type === "reviews") {
        return {
          key: String(item.key ?? "reviews"),
          type: "link",
          label:
            typeof item.label === "string"
              ? item.label
              : "REVIEWS",
          href:
            typeof item.href === "string"
              ? item.href
              : "/reviews",
        };
      }

      if (type === "bulk_orders") {
        return {
          key: String(item.key ?? "bulk_orders"),
          type: "bulk_orders",
          label: "BULK ORDERS",
          href: "/bulk-order",
        };
      }

      if (type === "link") {
        return {
          key: String(item.key ?? `link:${index}`),
          type: "link",
          label:
            typeof item.label === "string"
              ? item.label
              : "LINK",
          href:
            typeof item.href === "string"
              ? item.href
              : "/shop",
        };
      }

      if (type === "category" || type === "subcategory") {
        if (typeof item.id !== "string") {
          return null;
        }

        return {
          key: String(
            item.key ?? `${type}:${item.id}`,
          ),
          type,
          id: item.id,
        };
      }

      return null;
    })
    .filter((item): item is NavbarItem => item !== null);
}

export async function getNavbarCustomization(
  fallbackItems?: NavbarItem[],
): Promise<NavbarCustomizationConfig> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("homepage_sections")
    .select("description")
    .eq("section_key", NAVBAR_CUSTOMIZATION_KEY)
    .maybeSingle();

  const fallback: NavbarCustomizationConfig = {
    ...DEFAULT_NAVBAR_CUSTOMIZATION,
    items:
      fallbackItems && fallbackItems.length > 0
        ? fallbackItems
        : DEFAULT_NAVBAR_CUSTOMIZATION.items,
  };

  if (error || !data?.description) {
    return fallback;
  }

  try {
    const saved =
      typeof data.description === "string"
        ? JSON.parse(data.description)
        : data.description;

    return {
      ...DEFAULT_NAVBAR_CUSTOMIZATION,
      ...saved,
      items: normalizeItems(
        saved?.items,
        fallback.items,
      ),
    };
  } catch {
    return fallback;
  }
}
