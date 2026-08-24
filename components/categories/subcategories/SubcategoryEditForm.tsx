"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

type Props = {
  subcategory: Subcategory;
};

export default function SubcategoryEditForm({
  subcategory,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(subcategory.name);
  const [slug, setSlug] = useState(subcategory.slug);
  const [description, setDescription] = useState(
    subcategory.description ?? ""
  );
  const [displayOrder, setDisplayOrder] = useState(
    String(subcategory.display_order)
  );

  const [isActive, setIsActive] = useState(
    Boolean(subcategory.is_active)
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

    const cleanName = name.trim();
    const cleanSlug = slug.trim().toLowerCase();
    const cleanDescription = description.trim();
    const order = Number(displayOrder);

    // -----------------------------
    // Validation
    // -----------------------------

    if (!cleanName) {
      setError("Subcategory name is required.");
      return;
    }

    if (!cleanSlug) {
      setError("Subcategory slug is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError(
        "Slug can contain only lowercase letters, numbers, and hyphens."
      );
      return;
    }

    if (!Number.isInteger(order) || order < 0) {
      setError(
        "Display order must be a non-negative integer."
      );
      return;
    }

    // -----------------------------
    // Verify authenticated user
    // -----------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "SUBCATEGORY AUTH ERROR:",
        userError
      );

      setError(
        `Authentication check failed: ${userError.message}`
      );

      return;
    }

    if (!user) {
      console.error(
        "SUBCATEGORY UPDATE: No authenticated user."
      );

      setError(
        "No authenticated Supabase user found. Please log in again."
      );

      return;
    }

    console.log(
      "SUBCATEGORY UPDATE USER:",
      user.id
    );

    console.log(
      "SUBCATEGORY UPDATE EMAIL:",
      user.email
    );

    // -----------------------------
    // Exact update payload
    // -----------------------------

    const updatePayload = {
      name: cleanName,
      slug: cleanSlug,
      description: cleanDescription || null,
      display_order: order,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    console.log(
      "SUBCATEGORY UPDATE PAYLOAD:",
      {
        id: subcategory.id,
        ...updatePayload,
      }
    );

    setSaving(true);

    // -----------------------------
    // Update database
    //
    // IMPORTANT:
    // Do NOT use .select() here.
    //
    // The public SELECT policy only allows
    // rows where is_active = true.
    //
    // If we deactivate the row, asking
    // Supabase to return that row through
    // SELECT would trigger the SELECT RLS
    // policy and produce a 42501 error.
    // -----------------------------

    const { error } = await supabase
      .from("subcategories")
      .update(updatePayload)
      .eq("id", subcategory.id);

    // -----------------------------
    // Handle database error
    // -----------------------------

    if (error) {
      console.error(
        "SUBCATEGORY UPDATE ERROR:",
        error
      );

      if (error.code === "23505") {
        setError(
          "A subcategory with this slug already exists in this category."
        );
      } else if (error.code === "42501") {
        setError(
          "You do not have permission to update this subcategory."
        );
      } else {
        setError(error.message);
      }

      setSaving(false);
      return;
    }

    // -----------------------------
    // Update succeeded
    // -----------------------------

    console.log(
      "SUBCATEGORY UPDATE SUCCESS:",
      {
        id: subcategory.id,
        ...updatePayload,
      }
    );

    setSaving(false);

    setSuccess(
      isActive
        ? "Subcategory activated successfully."
        : "Subcategory deactivated successfully."
    );

    // Refresh server-rendered category data.
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl rounded-lg border bg-white p-6"
    >
      <div className="space-y-5">

        {/* Name */}
        <div>
          <label
            htmlFor="subcategory-name"
            className="mb-1 block text-sm font-medium"
          >
            Subcategory Name
          </label>

          <input
            id="subcategory-name"
            type="text"
            required
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Slug */}
        <div>
          <label
            htmlFor="subcategory-slug"
            className="mb-1 block text-sm font-medium"
          >
            Slug
          </label>

          <input
            id="subcategory-slug"
            type="text"
            required
            value={slug}
            onChange={(event) =>
              setSlug(
                event.target.value
                  .toLowerCase()
                  .replace(/\s+/g, "-")
              )
            }
            className="w-full rounded-md border px-3 py-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            Must be unique within this category.
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="subcategory-description"
            className="mb-1 block text-sm font-medium"
          >
            Description
          </label>

          <textarea
            id="subcategory-description"
            rows={4}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Display Order */}
        <div>
          <label
            htmlFor="subcategory-order"
            className="mb-1 block text-sm font-medium"
          >
            Display Order
          </label>

          <input
            id="subcategory-order"
            type="number"
            min="0"
            step="1"
            value={displayOrder}
            onChange={(event) =>
              setDisplayOrder(event.target.value)
            }
            className="w-full rounded-md border px-3 py-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            Lower numbers appear first.
          </p>
        </div>

        {/* Active */}
        <div className="rounded-md border p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              id="subcategory-active"
              type="checkbox"
              checked={isActive}
              onChange={(event) => {
                const checked =
                  event.target.checked;

                console.log(
                  "SUBCATEGORY ACTIVE CHECKBOX:",
                  checked
                );

                setIsActive(checked);
              }}
              className="h-4 w-4"
            />

            <span className="text-sm font-medium">
              Active
            </span>
          </label>

          <p className="mt-1 text-xs text-gray-500">
            Inactive subcategories will not appear in
            public active-subcategory queries.
          </p>

          <p className="mt-2 text-xs">
            Current value:{" "}
            <span className="font-semibold">
              {isActive
                ? "Active"
                : "Inactive"}
            </span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              router.push(
                `/admin/categories/${subcategory.category_id}`
              )
            }
            className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>

      </div>
    </form>
  );
}