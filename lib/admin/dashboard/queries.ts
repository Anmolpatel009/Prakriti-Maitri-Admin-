import { createClient } from "@/lib/supabase/server";

export async function getAdminDashboardData() {
  const supabase = await createClient();

  const [
    ordersResult,
    productsResult,
    inventoryResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        id,
        status,
        payment_status,
        total,
        created_at,
        profiles (
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("products")
      .select("id, name, is_active"),

    supabase
      .from("inventory")
      .select(`
        product_id,
        quantity,
        reserved_quantity,
        low_stock_threshold,
        products (
          id,
          name,
          sku,
          is_active
        )
      `)
      .order("updated_at", { ascending: false }),
  ]);

  if (ordersResult.error) {
    throw new Error(
      `Failed to load dashboard orders: ${ordersResult.error.message}`
    );
  }

  if (productsResult.error) {
    throw new Error(
      `Failed to load dashboard products: ${productsResult.error.message}`
    );
  }

  if (inventoryResult.error) {
    throw new Error(
      `Failed to load dashboard inventory: ${inventoryResult.error.message}`
    );
  }

  const orders = ordersResult.data ?? [];
  const products = productsResult.data ?? [];
  const inventory = inventoryResult.data ?? [];

  const revenue = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  const lowStock = inventory
    .map((item) => {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      const availableStock =
        Number(item.quantity ?? 0) -
        Number(item.reserved_quantity ?? 0);

      return {
        ...item,
        available_stock: availableStock,
        product,
        is_low_stock:
          availableStock <=
          Number(item.low_stock_threshold ?? 0),
      };
    })
    .filter((item) => item.is_low_stock);

  const recentOrders = orders.slice(0, 5);

  return {
    stats: {
      totalOrders: orders.length,
      revenue,
      products: products.length,
      lowStock: lowStock.length,
    },
    recentOrders,
    lowStock,
  };
}
