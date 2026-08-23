import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/auth";

export default async function AdminPage() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Prakriti Maitri Admin</h1>
      <p className="mt-2 text-gray-600">
        Admin authentication is working.
      </p>
    </main>
  );
}
