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
      bag_size,
      delivery_pincode,
      delivery_timeline,
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
      bag_size,
      delivery_pincode,
      delivery_timeline,
      reference_image_path,
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

  let referenceImageUrl: string | null = null;

  const bulkReferencePathPattern =
    /^bulk-orders\/[0-9a-f-]{36}\.(jpg|png|webp)$/i;

  if (
    data.reference_image_path &&
    bulkReferencePathPattern.test(data.reference_image_path)
  ) {
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("custom-bag-references")
      .getPublicUrl(data.reference_image_path);

    referenceImageUrl = publicUrl || null;
  }

  return {
    ...data,
    referenceImageUrl,
    category: Array.isArray(data.categories)
      ? data.categories[0]
      : data.categories,
    product: Array.isArray(data.products)
      ? data.products[0]
      : data.products,
  };
}
