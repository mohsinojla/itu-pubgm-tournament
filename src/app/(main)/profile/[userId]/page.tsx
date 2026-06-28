import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import ProfileCard from "@/components/profile/ProfileCard";
import PageHero from "@/components/common/PageHero";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  await connectDB();
  const user = await User.findById(userId).select("name pubgName").lean();
  if (!user) return { title: "Player Not Found" };
  return {
    title: `${user.name ?? user.pubgName ?? "Player"} — ITU × PUBGM Supremacy Cup`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  await connectDB();
  const user = await User.findById(userId)
    .select("-password -email -__v")
    .lean();

  if (!user || !user.profileCompleted) notFound();

  return (
    <>
      <PageHero
        title={user.name ?? "Player Profile"}
        subtitle={user.pubgName ? `In-game: ${user.pubgName}` : "Tournament Participant"}
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <ProfileCard user={JSON.parse(JSON.stringify({ ...user, email: "" }))} isOwn={false} />
      </div>
    </>
  );
}
