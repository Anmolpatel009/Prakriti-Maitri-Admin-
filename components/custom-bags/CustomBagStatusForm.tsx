"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { updateCustomBagRequest } from "@/lib/admin/custom-bags/actions";

type Props = {
  requestId: string;
  currentStatus: string;
  currentNotes: string | null;
};

const statuses = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

export default function CustomBagStatusForm({
  requestId,
  currentStatus,
  currentNotes,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      await updateCustomBagRequest(requestId, status, notes);

      setMessage("Custom bag request updated successfully.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update request."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border bg-white p-6"
    >
      <div>
        <h2 className="font-semibold">Manage Request</h2>
        <p className="mt-1 text-sm text-gray-500">
          Update the request status and keep internal notes.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Status</span>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Admin Notes</span>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          placeholder="Add quotation details, customer follow-up, supplier notes, etc."
          className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </form>
  );
}
