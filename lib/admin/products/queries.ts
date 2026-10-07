import { createClient } from "@/lib/supabase/server";

type AdminProductFilters = {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
};

export async function getAdminProducts(
  filters: AdminProductFilters = {},
) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`
      id,
      category_id,
      subcategory_id,
      name,
      slug,
      short_description,
      description,
      price,
      compare_at_price,
      sku,
      is_active,
      created_at,
      updated_at,
      inventory (
        quantity,
        reserved_quantity
      )
    `);

  const search = filters.search?.trim();

  if (search) {
    const safeSearch = search
      .replace(/[\\%_]/g, (value) => `\\${value}`)
      .replace(/,/g, "\\,");

    query = query.or(
      `name.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%`,
    );
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.subcategoryId) {
    query = query.eq("subcategory_id", filters.subcategoryId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return data ?? [];
}

export async function getAdminCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_active")
    .order("name");

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return data ?? [];
}

export async function getAdminSubcategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select(
      "id, category_id, name, slug, is_active, display_order"
    )
    .order("display_order")
    .order("name");

  if (error) {
    throw new Error(
      `Failed to load subcategories: ${error.message}`
    );
  }

  return data ?? [];
}

export async function getAdminProduct(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      category_id,
      subcategory_id,
      name,
      slug,
      short_description,
      description,
      price,
      compare_at_price,
      sku,
      is_active,
      minimum_order_quantity,
      inventory (
        quantity,
        reserved_quantity
      ),
      product_images (
        id,
        image_url,
        alt_text,
        display_order,
        created_at
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }

  return data;
}
