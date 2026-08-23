import { createClient } from "@/lib/supabase/server";

export async function getAdminInventory() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory")
    .select(`
      id,
      product_id,
      quantity,
      reserved_quantity,
      updated_at,
      products (
        id,
        name,
        sku,
        is_active
      )
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load inventory: ${error.message}`);
  }

  return data ?? [];
}

export async function getInventoryHistory(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_adjustments")
    .select(`
      id,
      product_id,
      quantity_change,
      quantity_before,
      quantity_after,
      reason,
      created_by,
      created_at
    `)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load inventory history: ${error.message}`
    );
  }

  return data ?? [];
}

export async function getInventoryProduct(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory")
    .select(`
      id,
      product_id,
      quantity,
      reserved_quantity,
      updated_at,
      products (
        id,
        name,
        sku,
        price,
        is_active
      )
    `)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load inventory product: ${error.message}`
    );
  }

  return data;
}
