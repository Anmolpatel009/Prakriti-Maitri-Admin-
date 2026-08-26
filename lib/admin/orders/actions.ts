"use server";

import { createClient } from "@/lib/supabase/server";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const allowedTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function isOrderStatus(
  value: string
): value is OrderStatus {
  return (
    ORDER_STATUSES as readonly string[]
  ).includes(value);
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string
) {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  if (!isOrderStatus(nextStatus)) {
    throw new Error(
      `Invalid order status: ${nextStatus}`
    );
  }

  const supabase = await createClient();

  /*
   * Verify authentication.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be authenticated.");
  }

  /*
   * Verify admin access.
   */
  const { data: admin, error: adminError } =
    await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (adminError) {
    throw new Error(
      `Failed to verify admin access: ${adminError.message}`
    );
  }

  if (!admin) {
    throw new Error(
      "You do not have permission to update orders."
    );
  }

  /*
   * Load the current order status.
   */
  const { data: order, error: orderError } =
    await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

  if (orderError) {
    throw new Error(
      `Failed to load order: ${orderError.message}`
    );
  }

  if (!order) {
    throw new Error("Order not found.");
  }

  /*
   * Validate the status currently stored in the database.
   */
  if (!isOrderStatus(order.status)) {
    throw new Error(
      `Order has an invalid current status: ${order.status}`
    );
  }

  const currentStatus = order.status;

  /*
   * Validate the requested transition.
   */
  const allowed =
    allowedTransitions[currentStatus];

  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Invalid order transition: ${currentStatus} → ${nextStatus}`
    );
  }

  /*
   * Update only the fulfillment status.
   *
   * Payment status is intentionally NOT modified here.
   */
  const { error: updateError } =
    await supabase
      .from("orders")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

  if (updateError) {
    throw new Error(
      `Failed to update order status: ${updateError.message}`
    );
  }

  return {
    success: true,
    orderId,
    previousStatus: currentStatus,
    status: nextStatus,
  };
}