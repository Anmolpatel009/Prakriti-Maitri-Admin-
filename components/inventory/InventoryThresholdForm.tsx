"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  currentThreshold: number;
};

export default function InventoryThresholdForm({
  productId,
  currentThreshold,
}: Props) {
  const router = useRouter();

  const [threshold, setThreshold] = useState(
    String(currentThreshold)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const value = Number(threshold);

    if (!Number.isInteger(value) || value < 0) {
      setError(
        "Threshold must be a non-negative integer."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/inventory/${productId}/threshold`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threshold: value,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to update threshold."
        );
      }

      setThreshold(String(result.inventory.low_stock_threshold));

      setSuccess(
        "Low-stock threshold updated successfully."
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update threshold."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-white p-6"
    >
      <div className="mb-4">
        <h3 className="font-semibold">
          Low Stock Threshold
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          The product is considered low stock when
          available inventory is at or below this value.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label
            htmlFor="low-stock-threshold"
            className="mb-1 block text-sm font-medium"
          >
            Threshold
          </label>

          <input
            id="low-stock-threshold"
            type="number"
            min="0"
            step="1"
            value={threshold}
            onChange={(event) =>
              setThreshold(event.target.value)
            }
            disabled={saving}
            className="w-full rounded-md border px-3 py-2 sm:w-40"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : "Save Threshold"}
        </button>
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
    </form>
  );
}