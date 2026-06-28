"use client";

interface Props {
  total: number;
  gender: Record<string, number>;
  degreeLevel: Record<string, number>;
  department: Record<string, number>;
  semester: Record<string, number>;
}

const PALETTE = [
  "#f2a316", // gold
  "#38bdf8", // sky
  "#a78bfa", // purple
  "#34d399", // green
  "#fb923c", // orange
  "#f472b6", // pink
  "#60a5fa", // blue
  "#facc15", // yellow
  "#4ade80", // lime
  "#f87171", // red
];

function HBar({
  data,
  total,
  labelFn,
}: {
  data: Record<string, number>;
  total: number;
  labelFn?: (key: string) => string;
}) {
  const sorted = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0)
    return <p className="text-sm text-[var(--text-2)]">No data yet</p>;

  return (
    <div className="space-y-3">
      {sorted.map(([key, count], i) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--text-1)]">{labelFn ? labelFn(key) : key}</span>
              <span className="text-[var(--text-2)]">
                {count} &middot; {Math.round(pct)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--surface)]">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  backgroundColor: PALETTE[i % PALETTE.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Donut({
  data,
  total,
  labelFn,
}: {
  data: Record<string, number>;
  total: number;
  labelFn?: (key: string) => string;
}) {
  let cumulative = 0;
  const segments = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, count], i) => {
      const pct = total > 0 ? (count / total) * 100 : 0;
      const seg = {
        key,
        count,
        pct,
        color: PALETTE[i % PALETTE.length],
        start: cumulative,
      };
      cumulative += pct;
      return seg;
    });

  const gradient = segments
    .map((s) => `${s.color} ${s.start}% ${s.start + s.pct}%`)
    .join(", ");

  if (segments.length === 0)
    return <p className="text-sm text-[var(--text-2)]">No data yet</p>;

  return (
    <div className="flex flex-wrap items-center gap-8">
      <div
        className="shrink-0 rounded-full"
        style={{
          width: 128,
          height: 128,
          background: `conic-gradient(${gradient})`,
          mask: "radial-gradient(circle at center, transparent 38%, black 39%)",
          WebkitMask: "radial-gradient(circle at center, transparent 38%, black 39%)",
        }}
      />
      <div className="space-y-2.5 flex-1 min-w-[140px]">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[var(--text-1)] capitalize flex-1">
              {labelFn ? labelFn(s.key) : s.key}
            </span>
            <span className="text-[var(--text-2)]">
              {s.count} ({Math.round(s.pct)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SemesterBars({ data }: { data: Record<string, number> }) {
  const max = Math.max(...Object.values(data), 1);
  const all = Array.from({ length: 8 }, (_, i) => String(i + 1));

  return (
    <div className="flex items-end gap-1.5 h-36">
      {all.map((s, i) => {
        const count = data[s] ?? 0;
        const heightPct = (count / max) * 100;
        return (
          <div key={s} className="flex flex-col items-center gap-1 flex-1">
            {count > 0 && (
              <span className="text-[10px] text-[var(--text-2)]">{count}</span>
            )}
            <div
              className="w-full rounded-t flex flex-col-reverse"
              style={{ height: 96 }}
            >
              <div
                className="w-full rounded-t transition-all duration-700"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: PALETTE[i % PALETTE.length],
                  minHeight: count > 0 ? 4 : 0,
                }}
              />
            </div>
            <span className="text-[10px] text-[var(--text-2)]">S{s}</span>
          </div>
        );
      })}
    </div>
  );
}

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Prefer not to say",
};

export default function DemographicsCharts({
  total,
  gender,
  degreeLevel,
  department,
  semester,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Total banner */}
      <div className="game-card p-6 text-center">
        <p className="text-[var(--text-2)] text-xs uppercase tracking-widest mb-1">
          Total Registered Players
        </p>
        <p className="font-heading text-6xl font-bold gold-text">{total}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender ratio */}
        <div className="game-card p-6">
          <h3 className="font-heading font-bold text-lg mb-5">Gender Ratio</h3>
          <Donut data={gender} total={total} labelFn={(k) => GENDER_LABELS[k] ?? k} />
        </div>

        {/* Degree level */}
        <div className="game-card p-6">
          <h3 className="font-heading font-bold text-lg mb-5">Degree Level</h3>
          <HBar data={degreeLevel} total={total} />
        </div>

        {/* Semester distribution */}
        <div className="game-card p-6">
          <h3 className="font-heading font-bold text-lg mb-5">Semester Distribution</h3>
          <SemesterBars data={semester} />
        </div>

        {/* Department */}
        <div className="game-card p-6">
          <h3 className="font-heading font-bold text-lg mb-5">Department</h3>
          <HBar data={department} total={total} />
        </div>
      </div>
    </div>
  );
}
