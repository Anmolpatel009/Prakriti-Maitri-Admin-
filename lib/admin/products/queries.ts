import { createClient } from "@/lib/supabase/server";

export async function getAdminProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      category_id,
      subcategory_id,
      name,
      slug,
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
    `)
    .order("created_at", { ascending: false });

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
      description,
      price,
      compare_at_price,
      sku,
      is_active,
      inventory (
        quantity,
        reserved_quantity
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }

  return data;
}
