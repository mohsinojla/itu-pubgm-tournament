import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Rules from "@/lib/db/models/Rules";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import PageHero from "@/components/common/PageHero";
import RulesViewer from "@/components/rules/RulesViewer";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const [session] = await Promise.all([auth(), connectDB()]);

  const rules = await Rules.findOne().lean();

  const canEdit =
    session?.user &&
    (isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.POST_ANNOUNCEMENTS));

  return (
    <>
      <PageHero title="Rules & Regulations" subtitle="Mandatory reading for all participants" />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <RulesViewer
          content={rules?.content ?? null}
          canEdit={!!canEdit}
        />
      </div>
    </>
  );
}
