import Link from "next/link";
import { getAdminCustomBagRequests } from "@/lib/admin/custom-bags/queries";

const statusLabels: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  quoted: "Quoted",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
};

export default async function AdminCustomBagsPage() {
  const requests = await getAdminCustomBagRequests();

  const counts = {
    total: requests.length,
    new: requests.filter((item) => item.status === "new").length,
    reviewing: requests.filter(
      (item) => item.status === "reviewing"
    ).length,
    quoted: requests.filter((item) => item.status === "quoted").length,
    approved: requests.filter(
      (item) => item.status === "approved"
    ).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Custom Bag Requests
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage customers interested in custom bags.
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
          ["Total", counts.total],
          ["New", counts.new],
          ["Reviewing", counts.reviewing],
          ["Quoted", counts.quoted],
          ["Approved", counts.approved],
        ].map(([label, count]) => (
          <div
            key={label}
            className="rounded-lg border bg-white p-5"
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">All Custom Bag Requests</h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">
              No custom bag requests yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium">Mobile</th>
                  <th className="px-5 py-3 font-medium">
                    Bag Type
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Price Range
                  </th>
                  <th className="px-5 py-3 font-medium">
                    Reference
                  </th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-5 py-4 font-medium">
                      {request.mobile}
                    </td>

                    <td className="px-5 py-4">
                      {request.bag_type}
                    </td>

                    <td className="px-5 py-4">
                      {request.expected_price_range ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {request.reference_image_url ? "Yes" : "No"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                        {statusLabels[request.status] ??
                          request.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {new Date(
                        request.created_at
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/custom-bags/${request.id}`}
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
