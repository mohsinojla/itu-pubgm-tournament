import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
    redirect("/");
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
