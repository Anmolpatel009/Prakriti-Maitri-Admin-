import { createClient } from "@/lib/supabase/server";

export async function getAdminBulkOrderEnquiries() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bulk_order_enquiries")
    .select(`
      id,
      name,
      mobile,
      email,
      business_name,
      quantity,
      purpose,
      message,
      status,
      admin_notes,
      created_at,
      updated_at,
      categories (
        id,
        name
      ),
      products (
        id,
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load bulk order enquiries: ${error.message}`
    );
  }

  return (data ?? []).map((enquiry) => ({
    ...enquiry,
    category: Array.isArray(enquiry.categories)
      ? enquiry.categories[0]
      : enquiry.categories,
    product: Array.isArray(enquiry.products)
      ? enquiry.products[0]
      : enquiry.products,
  }));
}

export async function getAdminBulkOrderEnquiry(id: string) {
  if (!id) {
    throw new Error("Bulk order enquiry ID is required.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bulk_order_enquiries")
    .select(`
      id,
      name,
      mobile,
      email,
      business_name,
      quantity,
      purpose,
      message,
      status,
      admin_notes,
      created_at,
      updated_at,
      categories (
        id,
        name
      ),
      products (
        id,
        name,
        slug
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(
      `Failed to load bulk order enquiry: ${error.message}`
    );
  }

  return {
    ...data,
    category: Array.isArray(data.categories)
      ? data.categories[0]
      : data.categories,
    product: Array.isArray(data.products)
      ? data.products[0]
      : data.products,
  };
}
