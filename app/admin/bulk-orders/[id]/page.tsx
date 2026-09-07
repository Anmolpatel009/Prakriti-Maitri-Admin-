import Link from "next/link";
import { getAdminBulkOrderEnquiry } from "@/lib/admin/bulk-orders/queries";
import BulkOrderStatusForm from "@/components/bulk-orders/BulkOrderStatusForm";

export default async function AdminBulkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enquiry = await getAdminBulkOrderEnquiry(id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/bulk-orders"
          className="text-sm underline"
        >
          ← Back to Bulk Order Enquiries
        </Link>

        <h1 className="mt-4 text-2xl font-semibold">
          Bulk Order Enquiry
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Submitted{" "}
          {new Date(enquiry.created_at).toLocaleString("en-IN")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">
            Customer Details
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium">{enquiry.name}</p>
            </div>

            <div>
              <p className="text-gray-500">Mobile</p>
              <p className="font-medium">{enquiry.mobile}</p>
            </div>

            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">
                {enquiry.email ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Business Name</p>
              <p className="font-medium">
                {enquiry.business_name ?? "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">
            Requirement
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-gray-500">
                Interested Category
              </p>

              <p className="font-medium">
                {enquiry.category?.name ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Interested Product
              </p>

              <p className="font-medium">
                {enquiry.product?.name ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Expected Quantity
              </p>

              <p className="font-medium">
                {enquiry.quantity}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Purpose
              </p>

              <p className="font-medium">
                {enquiry.purpose}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Additional Requirements
              </p>

              <p className="whitespace-pre-wrap">
                {enquiry.message ?? "—"}
              </p>
            </div>
          </div>
        </section>
      </div>

      <BulkOrderStatusForm
        enquiryId={enquiry.id}
        currentStatus={enquiry.status}
        currentNotes={enquiry.admin_notes}
      />
    </div>
  );
}
