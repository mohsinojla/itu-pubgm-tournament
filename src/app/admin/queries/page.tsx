import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import Query from "@/lib/db/models/Query";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import QueriesTable from "@/components/admin/QueriesTable";

export const dynamic = "force-dynamic";

export default async function AdminQueriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const hasAccess = isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_QUERIES);
  if (!hasAccess) redirect("/admin");

  await connectDB();
  const queries = await Query.find()
    .sort({ createdAt: -1 })
    .populate("userId", "name email photo pubgName")
    .lean();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Player Queries</h1>
      <QueriesTable queries={JSON.parse(JSON.stringify(queries))} />
    </div>
  );
}
