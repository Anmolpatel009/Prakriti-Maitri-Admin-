"use server";

import { createClient } from "@/lib/supabase/server";

const allowedStatuses = [
  "new",
  "reviewing",
  "quoted",
  "approved",
  "completed",
  "rejected",
] as const;

export async function updateCustomBagRequest(
  id: string,
  status: string,
  adminNotes: string
) {
  if (!id) {
    throw new Error("Custom bag request ID is required.");
  }

  if (
    !allowedStatuses.includes(
      status as (typeof allowedStatuses)[number]
    )
  ) {
    throw new Error("Invalid custom bag request status.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("custom_bag_requests")
    .update({
      status,
      admin_notes: adminNotes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      `Failed to update custom bag request: ${error.message}`
    );
  }
}
