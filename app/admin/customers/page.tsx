import Link from "next/link";
import { getAdminCustomers } from "@/lib/admin/customers/queries";

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Customers
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View customer profiles and account information.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-white p-5">
        <p className="text-sm text-gray-500">
          Total Customers
        </p>

        <p className="mt-2 text-2xl font-semibold">
          {customers.length}
        </p>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            All Customers
          </h2>
        </div>

        {customers.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No customers found.
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
                    Phone
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Country
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Onboarding
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Joined
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium">
                          {customer.customerName}
                        </p>

                        <p className="mt-1 font-mono text-xs text-gray-500">
                          {customer.id}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {customer.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {customer.country || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                        {customer.onboarding_complete
                          ? "Complete"
                          : "Incomplete"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {new Date(
                        customer.created_at
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-medium underline"
                      >
                        Manage
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