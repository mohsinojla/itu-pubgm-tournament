import { connectDB } from "@/lib/db/mongoose";
import Announcement from "@/lib/db/models/Announcement";
import PageHero from "@/components/common/PageHero";
import AnnouncementFeed from "@/components/announcements/AnnouncementFeed";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  await connectDB();
  const announcements = await Announcement.find()
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(30)
    .populate("postedBy", "name photo")
    .lean();

  return (
    <>
      <PageHero title="Announcements" subtitle="Stay up to date with tournament news" />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <AnnouncementFeed initialAnnouncements={JSON.parse(JSON.stringify(announcements))} />
      </div>
    </>
  );
}
