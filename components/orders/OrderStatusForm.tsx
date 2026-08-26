"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/admin/orders/actions";

type Props = {
  orderId: string;
  currentStatus: string;
};

const transitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const labels: Record<string, string> = {
  confirmed: "Confirm Order",
  processing: "Start Processing",
  shipped: "Mark Shipped",
  delivered: "Mark Delivered",
  cancelled: "Cancel Order",
};

export default function OrderStatusForm({
  orderId,
  currentStatus,
}: Props) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const nextStatuses =
    transitions[currentStatus] ?? [];

  async function handleStatusChange(
    nextStatus: string
  ) {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await updateOrderStatus(
        orderId,
        nextStatus
      );

      setSuccess(
        `Order status updated to "${nextStatus}".`
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update order status."
      );
    } finally {
      setSaving(false);
    }
  }

  if (nextStatuses.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h2 className="font-semibold">
          Fulfillment Status
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          This order has reached a final status.
        </p>

        <div className="mt-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
          {currentStatus}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-lg border bg-white p-6">
      <div>
        <h2 className="font-semibold">
          Fulfillment Status
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Current status:{" "}
          <span className="font-medium text-gray-900">
            {currentStatus}
          </span>
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {nextStatuses.map((status) => (
          <button
            key={status}
            type="button"
            disabled={saving}
            onClick={() =>
              handleStatusChange(status)
            }
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : labels[status] ?? status}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}
    </section>
  );
}