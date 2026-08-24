import { createClient } from "@/lib/supabase/server";

export async function getAdminCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(`
      id,
      name,
      slug,
      description,
      is_active,
      created_at,
      updated_at
    `)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load categories: ${error.message}`
    );
  }

  return data ?? [];
}

export async function getAdminCategory(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(`
      id,
      name,
      slug,
      description,
      is_active,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load category: ${error.message}`
    );
  }

  return data;
}

export async function getAdminSubcategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select(`
      id,
      category_id,
      name,
      slug,
      description,
      display_order,
      is_active,
      created_at,
      updated_at
    `)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load subcategories: ${error.message}`
    );
  }

  return data ?? [];
}
export async function getAdminSubcategory(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select(`
      id,
      category_id,
      name,
      slug,
      description,
      display_order,
      is_active,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load subcategory: ${error.message}`
    );
  }

  return data;
}