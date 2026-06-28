import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import AdminsManager from "@/components/admin/AdminsManager";

export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user)) redirect("/admin");

  await connectDB();
  const [admins, allPlayers] = await Promise.all([
    User.find({ role: { $in: ["admin", "super_admin"] } })
      .select("-password")
      .sort({ role: -1, name: 1 })
      .lean(),
    User.find({ profileCompleted: true, role: "player" })
      .select("name email photo")
      .sort({ name: 1 })
      .lean(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-2">Admin Management</h1>
      <p className="text-[var(--text-2)] text-sm mb-6">
        Only super admin can add or remove admins and configure their permissions.
      </p>
      <AdminsManager
        admins={JSON.parse(JSON.stringify(admins))}
        players={JSON.parse(JSON.stringify(allPlayers))}
      />
    </div>
  );
}
