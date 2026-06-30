import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Gallery from "@/lib/db/models/Gallery";
import GallerySection from "@/lib/db/models/GallerySection";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import PageHero from "@/components/common/PageHero";
import GalleryGrid from "@/components/gallery/GalleryGrid";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [session] = await Promise.all([auth(), connectDB()]);

  const [items, sections] = await Promise.all([
    Gallery.find().sort({ order: 1, createdAt: -1 }).lean(),
    GallerySection.find().sort({ order: 1, name: 1 }).lean(),
  ]);

  const isAdmin =
    session?.user &&
    (isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_GALLERY));

  return (
    <>
      <PageHero
        title="Memory Gallery"
        subtitle="Relive the epic moments of the Supremacy Cup"
      />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <GalleryGrid
          items={JSON.parse(JSON.stringify(items))}
          sections={JSON.parse(JSON.stringify(sections))}
          isAdmin={!!isAdmin}
        />
      </div>
    </>
  );
}
