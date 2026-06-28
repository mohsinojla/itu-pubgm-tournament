import { connectDB } from "@/lib/db/mongoose";
import AdminTeamMember from "@/lib/db/models/AdminTeamMember";
import { auth } from "@/lib/auth/auth";
import { isSuperAdmin } from "@/lib/auth/permissions";
import PageHero from "@/components/common/PageHero";
import AboutGrid from "@/components/about/AboutGrid";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [session] = await Promise.all([auth(), connectDB()]);

  const members = await AdminTeamMember.find().sort({ order: 1 }).lean();

  const isAdmin = session?.user && isSuperAdmin(session.user);

  return (
    <>
      <PageHero
        title="Meet the Team"
        subtitle="The people organizing the ITU × PUBGM Supremacy Cup"
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <AboutGrid
          members={JSON.parse(JSON.stringify(members))}
          isAdmin={!!isAdmin}
        />
      </div>
    </>
  );
}
