import { connectDB } from "@/lib/db/mongoose";
import Announcement from "@/lib/db/models/Announcement";
import PageHero from "@/components/common/PageHero";
import AnnouncementFeed from "@/components/announcements/AnnouncementFeed";
import { Sparkles } from "lucide-react";

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
      <PageHero title="News" subtitle="Stay up to date with tournament news" />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="fade-in-up game-card p-4 flex items-center gap-3 border-[var(--primary)]/20">
          <Sparkles size={18} className="text-[var(--primary)] shrink-0" />
          <p className="text-sm text-[var(--text-2)]">
            <span className="text-[var(--text-1)] font-medium">Match schedules and results</span> will
            be shared here on the website as the tournament progresses. Have fun!
          </p>
        </div>
        <AnnouncementFeed initialAnnouncements={JSON.parse(JSON.stringify(announcements))} />
      </div>
    </>
  );
}
