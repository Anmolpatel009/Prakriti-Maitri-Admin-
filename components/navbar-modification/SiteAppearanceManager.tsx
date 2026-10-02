"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SITE_APPEARANCE_KEY = "site_appearance";
const DEFAULT_SITE_BACKGROUND = "#f9f7f2";

export default function SiteAppearanceManager() {
  const [backgroundColor, setBackgroundColor] = useState(
    DEFAULT_SITE_BACKGROUND,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveAppearance() {
    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      const payload = {
        background_color: backgroundColor,
      };

      const { data: existing, error: lookupError } = await supabase
        .from("homepage_sections")
        .select("id")
        .eq("section_key", SITE_APPEARANCE_KEY)
        .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      if (existing?.id) {
        const { error } = await supabase
          .from("homepage_sections")
          .update({
            description: JSON.stringify(payload),
            section_type: "site_appearance",
            display_order: 996,
          })
          .eq("id", existing.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("homepage_sections")
          .insert({
            section_key: SITE_APPEARANCE_KEY,
            section_type: "site_appearance",
            title: "Site Appearance",
            description: JSON.stringify(payload),
            display_order: 996,
          });

        if (error) {
          throw error;
        }
      }

      setMessage("Site appearance saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save site appearance.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">
        Site Appearance
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Choose the global background color for the storefront.
      </p>

      <div className="mt-6 max-w-xl">
        <label className="block">
          <span className="text-xs font-medium text-gray-500">
            Global Site Background Color
          </span>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) =>
                setBackgroundColor(event.target.value)
              }
              className="h-11 w-16 cursor-pointer rounded-md border p-1"
            />

            <input
              type="text"
              value={backgroundColor}
              onChange={(event) =>
                setBackgroundColor(event.target.value)
              }
              className="w-40 rounded-lg border px-3 py-2 text-sm uppercase"
              placeholder="#F9F7F2"
            />
          </div>
        </label>

        <div
          className="mt-4 h-16 rounded-lg border"
          style={{ backgroundColor }}
        />

        <button
          type="button"
          onClick={saveAppearance}
          disabled={saving}
          className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Site Appearance"}
        </button>

        {message && (
          <p className="mt-3 text-sm text-gray-600">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
