import { createClient } from "@/lib/supabase/server";

export async function getAdminCustomers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      phone,
      country,
      onboarding_complete,
      created_at,
      updated_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Failed to load customers: ${error.message}`
    );
  }

  return (data ?? []).map((customer) => ({
    ...customer,
    customerName:
      [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ") || "Unnamed Customer",
  }));
}

export async function getAdminCustomer(customerId: string) {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      phone,
      country,
      onboarding_complete,
      created_at,
      updated_at,
      orders (
        id,
        status,
        subtotal,
        shipping_fee,
        total,
        payment_method,
        payment_status,
        created_at,
        updated_at
      )
    `)
    .eq("id", customerId)
    .single();

  if (error) {
    throw new Error(
      `Failed to load customer: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  const customerName =
    [data.first_name, data.last_name]
      .filter(Boolean)
      .join(" ") || "Unnamed Customer";

  return {
    ...data,
    customerName,
    orders: data.orders ?? [],
  };
}