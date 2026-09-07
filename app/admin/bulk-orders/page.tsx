import Link from "next/link";
import { getAdminBulkOrderEnquiries } from "@/lib/admin/bulk-orders/queries";

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  in_discussion: "In Discussion",
  converted: "Converted",
  closed: "Closed",
};

export default async function AdminBulkOrdersPage() {
  const enquiries = await getAdminBulkOrderEnquiries();

  const newCount = enquiries.filter(
    (item) => item.status === "new"
  ).length;

  const contactedCount = enquiries.filter(
    (item) => item.status === "contacted"
  ).length;

  const inDiscussionCount = enquiries.filter(
    (item) => item.status === "in_discussion"
  ).length;

  const convertedCount = enquiries.filter(
    (item) => item.status === "converted"
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Bulk Order Enquiries
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage customers interested in bulk purchases.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", enquiries.length],
          ["New", newCount],
          ["Contacted", contactedCount],
          ["In Discussion", inDiscussionCount],
          ["Converted", convertedCount],
        ].map(([label, count]) => (
          <div
            key={label}
            className="rounded-lg border bg-white p-5"
          >
            <p className="text-sm text-gray-500">
              {label}
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {count}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            All Bulk Enquiries
          </h2>
        </div>

        {enquiries.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">
              No bulk order enquiries yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Customer
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Business
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Interest
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Quantity
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Purpose
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Created
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {enquiry.name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {enquiry.mobile}
                        </p>

                        {enquiry.email && (
                          <p className="text-xs text-gray-500">
                            {enquiry.email}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {enquiry.business_name ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p>
                          {enquiry.product?.name ??
                            enquiry.category?.name ??
                            "General"}
                        </p>

                        {enquiry.product &&
                          enquiry.category && (
                            <p className="text-xs text-gray-500">
                              {enquiry.category.name}
                            </p>
                          )}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {enquiry.quantity}
                    </td>

                    <td className="px-5 py-4">
                      {enquiry.purpose}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                        {statusLabels[enquiry.status] ??
                          enquiry.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {new Date(
                        enquiry.created_at
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/bulk-orders/${enquiry.id}`}
                        className="font-medium underline"
                      >
                        View
                      </Link>
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
