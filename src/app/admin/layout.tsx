import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <AdminSidebar user={session.user} />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
