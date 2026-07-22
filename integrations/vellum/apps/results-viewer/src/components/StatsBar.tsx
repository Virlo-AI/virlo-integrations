export interface Stat {
  value: string | number;
  label: string;
}

/** The row of headline numbers shown at the top of each tab. */
export function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="stats-bar">
      {stats.map((s, i) => (
        <div className="stat" key={i}>
          <span className="value">{s.value}</span>
          <span className="label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
