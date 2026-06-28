import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import CommunityMember from "@/lib/db/models/CommunityMember";
import User from "@/lib/db/models/User";
import CommunityMembersManager from "@/components/admin/CommunityMembersManager";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "super_admin") redirect("/admin");

  await connectDB();

  const [members, allUsers] = await Promise.all([
    CommunityMember.find()
      .populate("userId", "name photo email degreeProgramme")
      .sort({ isHighlighted: -1, order: 1, createdAt: 1 })
      .lean(),
    User.find({ profileCompleted: true })
      .select("name email photo")
      .sort({ name: 1 })
      .lean(),
  ]);

  const existingIds = new Set(members.map((m) => m.userId.toString()));
  const availableUsers = allUsers.filter((u) => !existingIds.has(u._id.toString()));

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-2">Community Members</h1>
      <p className="text-[var(--text-2)] text-sm mb-6">
        Add registered players to the Community page with custom roles. Their name and photo are pulled from their profile. Only super admin can manage this.
      </p>
      <CommunityMembersManager
        members={JSON.parse(JSON.stringify(members))}
        availableUsers={JSON.parse(JSON.stringify(availableUsers))}
      />
    </div>
  );
}
