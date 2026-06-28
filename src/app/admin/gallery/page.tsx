import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import Gallery from "@/lib/db/models/Gallery";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import GalleryGrid from "@/components/gallery/GalleryGrid";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const canManage =
    isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_GALLERY);
  if (!canManage) redirect("/admin");

  await connectDB();
  const items = await Gallery.find().sort({ order: 1, createdAt: -1 }).lean();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Gallery Management</h1>
      <GalleryGrid items={JSON.parse(JSON.stringify(items))} isAdmin />
    </div>
  );
}
