import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/mongoose";
import GallerySection from "@/lib/db/models/GallerySection";
import CommunityMember from "@/lib/db/models/CommunityMember";
import CommunityAdmin from "@/components/admin/CommunityAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user)) redirect("/admin");

  await connectDB();

  const [events, allMembers] = await Promise.all([
    GallerySection.find().sort({ order: 1, createdAt: 1 }).lean(),
    CommunityMember.find()
      .populate("userId", "name photo email degreeProgramme")
      .sort({ order: 1, createdAt: 1 })
      .lean(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-2">Community Management</h1>
      <p className="text-sm text-[var(--text-2)] mb-8">
        Events are shared with the Gallery. Reorder them here to control display order on both pages.
      </p>
      <CommunityAdmin
        initialEvents={JSON.parse(JSON.stringify(events))}
        initialMembers={JSON.parse(JSON.stringify(allMembers))}
      />
    </div>
  );
}
