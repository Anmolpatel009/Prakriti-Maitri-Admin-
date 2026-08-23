"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  productId: string;
  currentQuantity: number;
};

export default function InventoryAdjustmentForm({
  productId,
  currentQuantity,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [change, setChange] = useState("");
  const [reason, setReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const numericChange = Number(change);

  const newQuantity =
    change === ""
      ? currentQuantity
      : currentQuantity + numericChange;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!change || numericChange === 0) {
      setError("Enter a non-zero stock adjustment.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for the adjustment.");
      return;
    }

    if (newQuantity < 0) {
      setError(
        "Stock cannot become negative."
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase.rpc(
      "adjust_inventory",
      {
        p_product_id: productId,
        p_quantity_change: numericChange,
        p_reason: reason.trim(),
      }
    );

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setChange("");
    setReason("");
    setSaving(false);

    router.refresh();
  }

  return (
    <section className="rounded-lg border bg-white p-6">
      <h3 className="font-semibold">
        Adjust Stock
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Add or remove inventory. Every adjustment is
        recorded in the stock history.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6"
      >
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Current stock
            </label>

            <div className="rounded-md border bg-gray-50 px-3 py-2">
              {currentQuantity}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Adjustment
            </label>

            <input
              type="number"
              step="1"
              value={change}
              onChange={(event) =>
                setChange(event.target.value)
              }
              placeholder="+20 or -5"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              New stock
            </label>

            <div className="rounded-md border bg-gray-50 px-3 py-2">
              {newQuantity}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium">
            Reason
          </label>

          <input
            required
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="New stock received"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Adjustment"}
          </button>
        </div>
      </form>
    </section>
  );
}
