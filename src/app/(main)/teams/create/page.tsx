import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import CreateTeamForm from "@/components/team/CreateTeamForm";
import PageHero from "@/components/common/PageHero";

export const dynamic = "force-dynamic";

export default async function CreateTeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Read team membership fresh from the DB rather than the session token —
  // the JWT only refreshes at sign-in, so a player who just left/was removed
  // from a team would otherwise get bounced back to their old (stale) team.
  await connectDB();
  const user = await User.findById(session.user.id).select("profileCompleted teamId");
  if (!user?.profileCompleted) redirect("/profile?onboarding=true");
  if (user.teamId) redirect(`/teams/${user.teamId}`);

  return (
    <>
      <PageHero title="Create a Team" subtitle="Lead your squad to victory" />
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="game-card p-6">
          <CreateTeamForm />
        </div>
      </div>
    </>
  );
}
