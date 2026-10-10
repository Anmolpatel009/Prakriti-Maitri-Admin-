import { createClient } from "@/lib/supabase/server";

type WeddingEnquiry = {
  id: string;
  bride_name: string;
  groom_name: string;
  contact_number: string | null;
  guest_range: string;
  gift_choice: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  in_discussion: "In Discussion",
  converted: "Converted",
  closed: "Closed",
};

export default async function WeddingReturnGiftEnquiriesPage() {
  const supabase = await createClient();
  const db = supabase as any;
  const { data, error } = await db
    .from("wedding_return_gift_enquiries")
    .select("id, bride_name, groom_name, contact_number, guest_range, gift_choice, status, admin_notes, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load wedding return-gift enquiries:", error);
    throw new Error("Failed to load wedding return-gift enquiries. Check the Supabase migration and admin permissions.");
  }

  const enquiries = (data ?? []) as WeddingEnquiry[];
  const newCount = enquiries.filter((item) => item.status === "new").length;
  const contactedCount = enquiries.filter((item) => item.status === "contacted").length;
  const convertedCount = enquiries.filter((item) => item.status === "converted").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Wedding Return Gift Enquiries</h1>
        <p className="mt-1 text-sm text-gray-500">
          Wedding gift quote requests submitted from the storefront.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Total enquiries", enquiries.length], ["New", newCount], ["Contacted", contactedCount], ["Converted", convertedCount]].map(([label, count]) => (
          <div key={String(label)} className="rounded-lg border bg-white p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">All Wedding Return Gift Requests</h2>
        </div>
        {enquiries.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">No wedding return-gift enquiries yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium">Couple</th>
                  <th className="px-5 py-3 font-medium">Contact number</th>
                  <th className="px-5 py-3 font-medium">Guest range</th>
                  <th className="px-5 py-3 font-medium">Return gift</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="align-top hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium">{enquiry.bride_name} &amp; {enquiry.groom_name}</td>
                    <td className="px-5 py-4 whitespace-nowrap">{enquiry.contact_number || "Not provided"}</td>
                    <td className="px-5 py-4">{enquiry.guest_range}</td>
                    <td className="px-5 py-4">{enquiry.gift_choice}</td>
                    <td className="px-5 py-4 whitespace-nowrap">{new Date(enquiry.created_at).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                        {statusLabels[enquiry.status] ?? enquiry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}