import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import Announcement from "@/lib/db/models/Announcement";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import AdminAnnouncementsPanel from "@/components/admin/AdminAnnouncementsPanel";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const canPost =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.POST_ANNOUNCEMENTS);
  if (!canPost) redirect("/admin");

  await connectDB();
  const announcements = await Announcement.find()
    .sort({ isPinned: -1, createdAt: -1 })
    .populate("postedBy", "name")
    .lean();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Announcements</h1>
      <AdminAnnouncementsPanel announcements={JSON.parse(JSON.stringify(announcements))} />
    </div>
  );
}
