import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import CompleteProfileForm from "@/components/auth/CompleteProfileForm";
import ProfileCard from "@/components/profile/ProfileCard";
import PageHero from "@/components/common/PageHero";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const isOnboarding = params.onboarding === "true";

  await connectDB();
  // include `provider` so ProfileCard can show/hide password change option
  const user = await User.findById(session.user.id).select("-password").lean();

  if (!user) redirect("/login");

  // If profile not complete, force onboarding
  if (!user.profileCompleted) {
    return (
      <div className="min-h-screen grid-bg">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold gold-text">
              Complete Your Profile
            </h1>
            <p className="mt-2 text-sm text-[var(--text-2)]">
              Fill in your details to join the tournament
            </p>
          </div>
          <div className="game-card p-6">
            <CompleteProfileForm />
          </div>
        </div>
      </div>
    );
  }

  if (isOnboarding) {
    return (
      <div className="min-h-screen grid-bg">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎉</div>
            <h1 className="font-heading text-3xl font-bold gold-text">
              Profile Updated
            </h1>
            <p className="mt-2 text-sm text-[var(--text-2)]">
              Update your details below
            </p>
          </div>
          <div className="game-card p-6">
            <CompleteProfileForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero
        title="My Profile"
        subtitle="Your tournament profile and stats"
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <ProfileCard user={JSON.parse(JSON.stringify(user))} isOwn />
      </div>
    </>
  );
}
