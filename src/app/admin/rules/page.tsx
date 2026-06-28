import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import Rules from "@/lib/db/models/Rules";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import RulesViewer from "@/components/rules/RulesViewer";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const canEdit =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.POST_ANNOUNCEMENTS);
  if (!canEdit) redirect("/admin");

  await connectDB();
  const rules = await Rules.findOne().lean();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Rules & Regulations</h1>
      <RulesViewer content={rules?.content ?? null} canEdit />
    </div>
  );
}
