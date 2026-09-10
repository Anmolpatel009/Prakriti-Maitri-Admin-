import { createClient } from "@/lib/supabase/server";

export type CustomBagRequest = {
  id: string;
  mobile: string;
  bag_type: string;
  description: string;
  reference_image_url: string | null;
  expected_price_range: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function getAdminCustomBagRequests(): Promise<CustomBagRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("custom_bag_requests")
    .select(`
      id,
      mobile,
      bag_type,
      description,
      reference_image_url,
      expected_price_range,
      status,
      admin_notes,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to load custom bag requests: ${error.message}`
    );
  }

  return (data ?? []) as CustomBagRequest[];
}

export async function getAdminCustomBagRequest(
  id: string
): Promise<CustomBagRequest> {
  if (!id) {
    throw new Error("Custom bag request ID is required.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("custom_bag_requests")
    .select(`
      id,
      mobile,
      bag_type,
      description,
      reference_image_url,
      expected_price_range,
      status,
      admin_notes,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(
      `Failed to load custom bag request: ${error.message}`
    );
  }

  return data as CustomBagRequest;
}
