import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import CreateTeamForm from "@/components/team/CreateTeamForm";
import PageHero from "@/components/common/PageHero";

export default async function CreateTeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.profileCompleted) redirect("/profile?onboarding=true");
  if (session.user.teamId) redirect(`/teams/${session.user.teamId}`);

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
