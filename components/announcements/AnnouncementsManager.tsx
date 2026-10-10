"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ANNOUNCEMENTS_KEY = "storefront_announcements";
const DIWALI_KEY = "diwali_sale_mosaic";
const DEFAULT_SALE_END = "2026-11-08T23:59:00+05:30";

type AnnouncementConfig = {
  enabled: boolean;
  desktopText: string;
  mobileText: string;
  bulkLinkEnabled: boolean;
  bulkLinkText: string;
  bulkLinkUrl: string;
};

type DiwaliFormConfig = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  endsText: string;
  saleEndLocal: string;
  hideAfterEnd: boolean;
};

type ConfigRecord = Record<string, unknown>;

const DEFAULT_ANNOUNCEMENTS: AnnouncementConfig = {
  enabled: true,
  desktopText: "Free delivery over ₹100 order value",
  mobileText: "Bulk orders · custom logo · PAN India delivery",
  bulkLinkEnabled: true,
  bulkLinkText: "Bulk enquiries",
  bulkLinkUrl: "/bulk-order",
};

function parseObject(value: string | null | undefined): ConfigRecord {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as ConfigRecord)
      : {};
  } catch {
    return {};
  }
}

function textValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function toDateTimeLocal(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return toDateTimeLocal(DEFAULT_SALE_END);
  }
  const localDate = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
}

async function saveSection(
  key: string,
  title: string,
  sectionType: string,
  description: string,
  displayOrder: number,
) {
  const supabase = createClient();
  const { data: existing, error: lookupError } = await supabase
    .from("homepage_sections")
    .select("id")
    .eq("section_key", key)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing?.id) {
    const { error } = await supabase
      .from("homepage_sections")
      .update({
        title,
        section_type: sectionType,
        description,
        display_order: displayOrder,
        is_active: true,
      })
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from("homepage_sections").insert({
      section_key: key,
      title,
      section_type: sectionType,
      description,
      display_order: displayOrder,
      is_active: true,
    });

    if (error) throw error;
  }
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-gray-600"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
      {label}
    </label>
  );
}

export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] =
    useState<AnnouncementConfig>(DEFAULT_ANNOUNCEMENTS);
  const [diwali, setDiwali] = useState<DiwaliFormConfig>({
    enabled: true,
    eyebrow: "LIMITED PERIOD",
    title: "Diwali Sale",
    endsText: "Ends Diwali night",
    saleEndLocal: toDateTimeLocal(DEFAULT_SALE_END),
    hideAfterEnd: true,
  });
  const [diwaliStoredConfig, setDiwaliStoredConfig] =
    useState<ConfigRecord>({});
  const [loading, setLoading] = useState(true);
  const [savingAnnouncements, setSavingAnnouncements] = useState(false);
  const [savingDiwali, setSavingDiwali] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const supabase = createClient();
        const [announcementResult, diwaliResult] = await Promise.all([
          supabase
            .from("homepage_sections")
            .select("description")
            .eq("section_key", ANNOUNCEMENTS_KEY)
            .maybeSingle(),
          supabase
            .from("homepage_sections")
            .select("description")
            .eq("section_key", DIWALI_KEY)
            .maybeSingle(),
        ]);

        if (announcementResult.error) throw announcementResult.error;
        if (diwaliResult.error) throw diwaliResult.error;

        if (cancelled) return;

        const a = parseObject(announcementResult.data?.description);
        setAnnouncements({
          enabled: a.enabled !== false,
          desktopText: textValue(
            a.desktopText,
            DEFAULT_ANNOUNCEMENTS.desktopText,
          ),
          mobileText: textValue(
            a.mobileText,
            DEFAULT_ANNOUNCEMENTS.mobileText,
          ),
          bulkLinkEnabled: a.bulkLinkEnabled !== false,
          bulkLinkText: textValue(
            a.bulkLinkText,
            DEFAULT_ANNOUNCEMENTS.bulkLinkText,
          ),
          bulkLinkUrl: textValue(
            a.bulkLinkUrl,
            DEFAULT_ANNOUNCEMENTS.bulkLinkUrl,
          ),
        });

        const d = parseObject(diwaliResult.data?.description);
        setDiwaliStoredConfig(d);
        const configuredSaleEnd = textValue(
          d.saleEnd ?? d.sale_end,
          DEFAULT_SALE_END,
        );

        setDiwali({
          enabled: d.enabled !== false,
          eyebrow: textValue(d.eyebrow, "LIMITED PERIOD"),
          title: textValue(d.title, "Diwali Sale"),
          endsText: textValue(d.endsText, "Ends Diwali night"),
          saleEndLocal: toDateTimeLocal(configuredSaleEnd),
          hideAfterEnd:
            d.hideAfterEnd !== false && d.hide_after_end !== false,
        });
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? `Could not load settings: ${error.message}`
              : "Could not load settings.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveAnnouncements(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const url = announcements.bulkLinkUrl.trim();
    if (
      announcements.bulkLinkEnabled &&
      url &&
      !url.startsWith("/") &&
      !/^https?:\/\//i.test(url)
    ) {
      setMessage("Bulk Enquiries URL must start with / or use http:// or https://.");
      return;
    }

    setSavingAnnouncements(true);
    try {
      await saveSection(
        ANNOUNCEMENTS_KEY,
        "Storefront Announcements",
        "storefront_announcements",
        JSON.stringify({
          ...announcements,
          desktopText: announcements.desktopText.trim(),
          mobileText: announcements.mobileText.trim(),
          bulkLinkText: announcements.bulkLinkText.trim(),
          bulkLinkUrl: url,
        }),
        994,
      );
      setMessage("Announcement strip settings saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Announcement save failed: ${error.message}`
          : "Announcement save failed.",
      );
    } finally {
      setSavingAnnouncements(false);
    }
  }

  async function saveDiwali(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const parsedDeadline = new Date(diwali.saleEndLocal);
    if (
      !diwali.saleEndLocal ||
      Number.isNaN(parsedDeadline.getTime())
    ) {
      setMessage("Enter a valid Diwali Sale deadline.");
      return;
    }

    setSavingDiwali(true);
    try {
      const saleEnd = parsedDeadline.toISOString();

      // Merge the existing JSON so product slots, tote category,
      // and other current Diwali settings are retained.
      const nextConfig: ConfigRecord = {
        ...diwaliStoredConfig,
        enabled: diwali.enabled,
        eyebrow: diwali.eyebrow.trim(),
        title: diwali.title.trim(),
        endsText: diwali.endsText.trim(),
        saleEnd,
        hideAfterEnd: diwali.hideAfterEnd,
        hide_after_end: diwali.hideAfterEnd,
      };

      await saveSection(
        DIWALI_KEY,
        "Diwali Sale Mosaic",
        "diwali_sale_mosaic",
        JSON.stringify(nextConfig),
        995,
      );

      setDiwaliStoredConfig(nextConfig);
      setMessage("Diwali Sale settings saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Diwali Sale save failed: ${error.message}`
          : "Diwali Sale save failed.",
      );
    } finally {
      setSavingDiwali(false);
    }
  }

  if (loading) {
    return <section className="mt-6 rounded-xl border bg-white p-6">Loading announcement settings…</section>;
  }

  return (
    <div className="mt-6 space-y-6">
      {message && (
        <p role="status" className="rounded-lg border bg-white p-3 text-sm text-gray-800">
          {message}
        </p>
      )}

      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Announcement strip</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure the thin strip at the top of the storefront.
          </p>
        </div>

        <form onSubmit={saveAnnouncements} className="space-y-5">
          <Toggle
            label="Show the announcement strip"
            checked={announcements.enabled}
            onChange={(enabled) => setAnnouncements((old) => ({ ...old, enabled }))}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Desktop message"
              value={announcements.desktopText}
              onChange={(desktopText) => setAnnouncements((old) => ({ ...old, desktopText }))}
            />
            <TextField
              label="Mobile message"
              value={announcements.mobileText}
              onChange={(mobileText) => setAnnouncements((old) => ({ ...old, mobileText }))}
            />
            <TextField
              label="Bulk link text"
              value={announcements.bulkLinkText}
              onChange={(bulkLinkText) => setAnnouncements((old) => ({ ...old, bulkLinkText }))}
            />
            <TextField
              label="Bulk link URL"
              value={announcements.bulkLinkUrl}
              onChange={(bulkLinkUrl) => setAnnouncements((old) => ({ ...old, bulkLinkUrl }))}
              placeholder="/bulk-order"
            />
          </div>

          <Toggle
            label="Show the Bulk Enquiries link"
            checked={announcements.bulkLinkEnabled}
            onChange={(bulkLinkEnabled) =>
              setAnnouncements((old) => ({ ...old, bulkLinkEnabled }))
            }
          />

          <button
            type="submit"
            disabled={savingAnnouncements}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {savingAnnouncements ? "Saving…" : "Save announcement strip"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Diwali Sale banner</h2>
          <p className="mt-1 text-sm text-gray-500">
            Change the banner text, countdown deadline, and display behavior.
            The deadline is entered in your browser’s local time and saved as an exact timestamp.
          </p>
        </div>

        <form onSubmit={saveDiwali} className="space-y-5">
          <Toggle
            label="Enable the Diwali Sale banner"
            checked={diwali.enabled}
            onChange={(enabled) => setDiwali((old) => ({ ...old, enabled }))}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Eyebrow"
              value={diwali.eyebrow}
              onChange={(eyebrow) => setDiwali((old) => ({ ...old, eyebrow }))}
            />
            <TextField
              label="Banner title"
              value={diwali.title}
              onChange={(title) => setDiwali((old) => ({ ...old, title }))}
            />
            <TextField
              label="Ending caption"
              value={diwali.endsText}
              onChange={(endsText) => setDiwali((old) => ({ ...old, endsText }))}
            />
            <label className="block text-sm font-medium text-gray-700">
              Sale deadline
              <input
                type="datetime-local"
                required
                value={diwali.saleEndLocal}
                onChange={(event) =>
                  setDiwali((old) => ({ ...old, saleEndLocal: event.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
          </div>

          <Toggle
            label="Hide the banner after the deadline"
            checked={diwali.hideAfterEnd}
            onChange={(hideAfterEnd) =>
              setDiwali((old) => ({ ...old, hideAfterEnd }))
            }
          />

          <button
            type="submit"
            disabled={savingDiwali}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {savingDiwali ? "Saving…" : "Save Diwali Sale settings"}
          </button>
        </form>
      </section>
    </div>
  );
}
