import AnnouncementsManager from "@/components/announcements/AnnouncementsManager";

export default function AnnouncementsPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Announcements
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage storefront announcement messaging and promotional banner settings.
        </p>
        <AnnouncementsManager />
      </div>
    </main>
  );
}
