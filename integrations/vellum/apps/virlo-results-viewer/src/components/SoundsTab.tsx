import type { Sound } from "../types";
import { StatsBar } from "./StatsBar";

export function SoundsTab({ sounds }: { sounds: Sound[] }) {
  if (!sounds.length)
    return (
      <div className="empty">
        <h3>No sounds</h3>
      </div>
    );

  return (
    <>
      <StatsBar stats={[{ value: sounds.length, label: "Rising Sounds" }]} />
      <div className="sound-grid">
        {sounds.map((s, i) => {
          const name = s.sound_name || s.name || s.title || "";
          return (
            <div className="sound-card" key={i}>
              <span className="sound-icon">♪</span>
              <span className="sound-name">{name}</span>
              <span className="sound-platform">{s.platform || ""}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
