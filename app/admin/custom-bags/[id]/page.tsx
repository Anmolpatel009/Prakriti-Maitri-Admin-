import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCustomBagRequest } from "@/lib/admin/custom-bags/queries";
import CustomBagStatusForm from "@/components/custom-bags/CustomBagStatusForm";

export default async function AdminCustomBagDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let request;

  try {
    request = await getAdminCustomBagRequest(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/custom-bags"
          className="text-sm underline"
        >
          ← Back to Custom Bag Requests
        </Link>

        <h1 className="mt-4 text-2xl font-semibold">
          Custom Bag Request
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Submitted{" "}
          {new Date(request.created_at).toLocaleString("en-IN")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Customer Contact</h2>

          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-gray-500">Mobile</p>
              <p className="font-medium">{request.mobile}</p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium">
                {request.status}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Submitted</p>
              <p className="font-medium">
                {new Date(request.created_at).toLocaleString(
                  "en-IN"
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Requirement</h2>

          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-gray-500">Bag Type</p>
              <p className="font-medium">{request.bag_type}</p>
            </div>

            <div>
              <p className="text-gray-500">
                Expected Price Range
              </p>
              <p className="font-medium">
                {request.expected_price_range ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Description</p>
              <p className="whitespace-pre-wrap">
                {request.description}
              </p>
            </div>
          </div>
        </section>
      </div>

      {request.reference_image_url && (
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold">Reference Image</h2>

          <div className="mt-5 overflow-hidden rounded-lg border bg-gray-50">
            <img
              src={request.reference_image_url}
              alt="Customer reference for custom bag"
              className="max-h-[600px] w-full object-contain"
            />
          </div>

          <a
            href={request.reference_image_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-medium underline"
          >
            Open full-size reference
          </a>
        </section>
      )}

      <CustomBagStatusForm
        requestId={request.id}
        currentStatus={request.status}
        currentNotes={request.admin_notes}
      />
    </div>
  );
}
