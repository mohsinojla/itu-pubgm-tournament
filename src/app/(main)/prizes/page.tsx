import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import PrizeImage from "@/lib/db/models/PrizeImage";
import { isSuperAdmin, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import PageHero from "@/components/common/PageHero";
import PrizePoolImages from "@/components/prizes/PrizePoolImages";
import { Trophy, Award, Gift, MapPin, Shirt, Medal } from "lucide-react";

export const dynamic = "force-dynamic";

const DIVISIONS = [
  { place: "1st Place", pct: "50%", icon: Trophy, color: "text-[var(--primary)]" },
  { place: "2nd Place", pct: "30%", icon: Medal, color: "text-[var(--text-1)]" },
  { place: "3rd Place", pct: "20%", icon: Medal, color: "text-[var(--primary-dim)]" },
];

export default async function PrizesPage() {
  const [session] = await Promise.all([auth(), connectDB()]);

  const images = await PrizeImage.find().sort({ order: 1, createdAt: -1 }).lean();

  const isAdmin =
    !!session?.user &&
    (isSuperAdmin(session.user) || hasPermission(session.user, PERMISSIONS.MANAGE_GALLERY));
  const canDelete = !!session?.user && isSuperAdmin(session.user);

  return (
    <>
      <PageHero
        title="Prizes & Rewards"
        subtitle="Fight for glory — and a share of the pool"
      />
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {/* Prize pool headline */}
        <section className="fade-in-up relative overflow-hidden rounded-3xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/10 via-[var(--surface)] to-[var(--card)] p-8 sm:p-12 text-center">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[var(--primary)]/10 blur-3xl pointer-events-none glow-pulse" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-2)] mb-3">
              Total Prize Pool
            </p>
            <p className="font-heading text-5xl sm:text-6xl font-black gold-text-animated">
              PKR 27K – 43K
            </p>
            <p className="mt-3 text-[var(--text-2)] max-w-lg mx-auto">
              The final prize pool depends on the number of participating teams — more squads,
              bigger stakes. Minimum guaranteed pool is <span className="text-[var(--primary)] font-semibold">27K</span>.
            </p>
          </div>
        </section>

        {/* Division rule */}
        <section className="fade-in-up">
          <SectionHeading icon={<Award size={18} />}>Prize Division</SectionHeading>
          <div className="stagger-fade grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DIVISIONS.map((d) => (
              <div
                key={d.place}
                className="game-card p-6 text-center flex flex-col items-center gap-2"
              >
                <d.icon size={28} className={d.color} />
                <p className="font-heading font-bold text-lg">{d.place}</p>
                <p className={`font-heading text-3xl font-black ${d.color}`}>{d.pct}</p>
                <p className="text-xs text-[var(--text-2)]">of total prize pool</p>
              </div>
            ))}
          </div>
        </section>

        {/* Extra perks */}
        <section className="fade-in-up">
          <SectionHeading icon={<Gift size={18} />}>More Than Just Prize Money</SectionHeading>
          <div className="stagger-fade grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PerkCard
              icon={<Award size={20} />}
              title="Certificates for Finalists"
              description="Every player who qualifies for the final gets an official certificate of participation."
            />
            <PerkCard
              icon={<Gift size={20} />}
              title="Random Gifts"
              description="Students taking part in on-campus PUBGM activities stand a chance to win surprise gifts."
            />
            <PerkCard
              icon={<Shirt size={20} />}
              title="Team Shirts"
              description="Custom shirts for the recently hired management team — hiring is starting soon, so stay tuned!"
            />
            <PerkCard
              icon={<MapPin size={20} />}
              title="Need More Info?"
              description="Visit the Registration Desk on campus for any questions about prizes or eligibility."
            />
          </div>
        </section>

        {/* Admin-manageable image gallery */}
        <PrizePoolImages images={JSON.parse(JSON.stringify(images))} isAdmin={isAdmin} canDelete={canDelete} />
      </div>
    </>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-[var(--primary)]">{icon}</span>
      <h2 className="font-heading text-2xl font-bold">{children}</h2>
    </div>
  );
}

function PerkCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="game-card p-6 flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 shrink-0">
        <span className="text-[var(--primary)]">{icon}</span>
      </div>
      <div>
        <h3 className="font-heading font-bold text-[var(--text-1)]">{title}</h3>
        <p className="text-sm text-[var(--text-2)] mt-1">{description}</p>
      </div>
    </div>
  );
}
