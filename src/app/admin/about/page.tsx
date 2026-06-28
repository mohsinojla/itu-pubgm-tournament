import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/mongoose";
import AdminTeamMember from "@/lib/db/models/AdminTeamMember";
import AboutGrid from "@/components/about/AboutGrid";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const session = await auth();
  if (!session?.user?.id || !isSuperAdmin(session.user)) redirect("/admin");

  await connectDB();
  const members = await AdminTeamMember.find().sort({ order: 1 }).lean();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">About Page — Team Members</h1>
      <AboutGrid members={JSON.parse(JSON.stringify(members))} isAdmin />
    </div>
  );
}
