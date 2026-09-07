"use server";

import { createClient } from "@/lib/supabase/server";

const allowedStatuses = [
  "new",
  "contacted",
  "in_discussion",
  "converted",
  "closed",
] as const;

export async function updateBulkOrderEnquiry(
  id: string,
  status: string,
  adminNotes: string
) {
  if (!id) {
    throw new Error("Enquiry ID is required.");
  }

  if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
    throw new Error("Invalid enquiry status.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("bulk_order_enquiries")
    .update({
      status,
      admin_notes: adminNotes.trim() || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      `Failed to update enquiry: ${error.message}`
    );
  }
}
