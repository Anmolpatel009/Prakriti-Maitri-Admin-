import { createClient } from "@/lib/supabase/server";

export async function getAdminOrders() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      status,
      subtotal,
      shipping_fee,
      total,
      payment_method,
      payment_status,
      payment_id,
      created_at,
      updated_at,
      profiles (
        id,
        first_name,
        last_name,
        phone,
        country
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Failed to load orders: ${error.message}`
    );
  }

  return (data ?? []).map((order) => {
    const profile = Array.isArray(order.profiles)
      ? order.profiles[0]
      : order.profiles;

    const customerName =
      [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(" ") || "Unknown Customer";

    return {
      ...order,
      profile,
      customerName,
    };
  });
}
export async function getAdminOrder(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      status,
      subtotal,
      shipping_fee,
      total,
      shipping_first_name,
      shipping_last_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_country,
      shipping_postal_code,
      payment_method,
      payment_status,
      payment_id,
      created_at,
      updated_at,
      profiles (
        id,
        first_name,
        last_name,
        phone,
        country
      ),
      order_items (
        id,
        product_id,
        product_name,
        product_sku,
        quantity,
        unit_price,
        line_total,
        created_at
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    throw new Error(
      `Failed to load order: ${error.message}`
    );
  }

  return data;
}