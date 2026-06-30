import { connectDB } from "@/lib/db/mongoose";
import PlayerStats from "@/lib/db/models/PlayerStats";
import Team from "@/lib/db/models/Team";
import PageHero from "@/components/common/PageHero";
import { Trophy, Swords, Star, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getHonourData() {
  await connectDB();

  const [topFragger, topTeam, mostMVP, topKD] = await Promise.all([
    PlayerStats.findOne({ isHidden: { $ne: true } })
      .sort({ totalKills: -1 })
      .populate("userId", "name photo pubgName isVerifiedPlayer _id")
      .lean(),
    Team.findOne().sort({ totalPoints: -1 }).lean(),
    PlayerStats.findOne({ isHidden: { $ne: true } })
      .sort({ mvpCount: -1 })
      .populate("userId", "name photo pubgName _id")
      .lean(),
    PlayerStats.findOne({ isHidden: { $ne: true }, matchesPlayed: { $gte: 1 } })
      .sort({ killDeathRatio: -1 })
      .populate("userId", "name photo pubgName _id")
      .lean(),
  ]);

  return { topFragger, topTeam, mostMVP, topKD };
}

export default async function HonourBoardPage() {
  const { topFragger, topTeam, mostMVP, topKD } = await getHonourData();

  const hasData = topFragger || topTeam || mostMVP || topKD;

  return (
    <>
      <PageHero title="Honour Board" subtitle="The best of the Supremacy Cup" />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {!hasData ? (
          <div className="text-center py-20 text-[var(--text-2)]">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-heading">No data yet</p>
            <p className="text-sm mt-2">Honour board will be updated as matches are played.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {topFragger && (
              <HonourCard
                title="Top Fragger"
                icon={<Swords size={20} className="text-[var(--primary)]" />}
                player={topFragger.userId as unknown as { _id: string; name?: string; photo?: string; pubgName?: string }}
                stat={`${topFragger.totalKills} kills`}
                href={`/profile/${(topFragger.userId as unknown as { _id: string })._id}`}
              />
            )}
            {mostMVP && (
              <HonourCard
                title="Most MVP"
                icon={<Star size={20} className="text-[var(--primary)]" />}
                player={mostMVP.userId as unknown as { _id: string; name?: string; photo?: string; pubgName?: string }}
                stat={`${mostMVP.mvpCount} MVP award${mostMVP.mvpCount !== 1 ? "s" : ""}`}
                href={`/profile/${(mostMVP.userId as unknown as { _id: string })._id}`}
              />
            )}
            {topKD && (
              <HonourCard
                title="Best K/D Ratio"
                icon={<Trophy size={20} className="text-[var(--primary)]" />}
                player={topKD.userId as unknown as { _id: string; name?: string; photo?: string; pubgName?: string }}
                stat={`${topKD.killDeathRatio.toFixed(2)} K/D`}
                href={`/profile/${(topKD.userId as unknown as { _id: string })._id}`}
              />
            )}
            {topTeam && (
              <HonourCard
                title="Top Team"
                icon={<Users size={20} className="text-[var(--primary)]" />}
                teamName={topTeam.name as string}
                teamTag={topTeam.teamId as string}
                stat={`${topTeam.totalPoints ?? 0} points · ${topTeam.wins ?? 0} wins`}
                href={`/teams/${topTeam._id}`}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

interface HonourCardProps {
  title: string;
  icon: React.ReactNode;
  player?: { _id: string; name?: string; photo?: string; pubgName?: string };
  teamName?: string;
  teamTag?: string;
  stat: string;
  href: string;
}

function HonourCard({ title, icon, player, teamName, teamTag, stat, href }: HonourCardProps) {
  return (
    <Link href={href} className="group game-card p-6 hover:border-[var(--primary-dim)] transition-colors block">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-[var(--primary)]/10">{icon}</div>
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[var(--text-2)]">{title}</h3>
      </div>

      {player ? (
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--primary-dim)] shrink-0">
            {player.photo ? (
              <Image src={player.photo} alt={player.name ?? ""} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center text-lg font-bold text-[var(--primary)]">
                {player.name?.[0]}
              </div>
            )}
          </div>
          <div>
            <p className="font-heading font-bold text-lg group-hover:text-[var(--primary)] transition-colors">
              {player.name}
            </p>
            <p className="text-xs font-mono text-[var(--text-2)]">{player.pubgName}</p>
            <p className="text-sm font-bold text-[var(--primary)] mt-1">{stat}</p>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-heading font-bold text-lg group-hover:text-[var(--primary)] transition-colors">
            [{teamTag}] {teamName}
          </p>
          <p className="text-sm font-bold text-[var(--primary)] mt-1">{stat}</p>
        </div>
      )}
    </Link>
  );
}
