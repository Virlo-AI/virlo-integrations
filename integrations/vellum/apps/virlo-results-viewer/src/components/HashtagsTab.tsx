import { useEffect, useState } from "react";
import type { Hashtag } from "../types";
import { fmt } from "../lib/format";
import { StatsBar } from "./StatsBar";

function htViews(h: Hashtag): number {
  return h.views || h.total_views || 0;
}

export function HashtagsTab({ hashtags }: { hashtags: Hashtag[] }) {
  // Bars start at 0 width and animate to their real width on mount, matching
  // the original's requestAnimationFrame reflow trick.
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(id);
  }, []);

  if (!hashtags.length)
    return (
      <div className="empty">
        <h3>No hashtags</h3>
      </div>
    );

  const maxHt = Math.max(...hashtags.map(htViews), 1);

  return (
    <>
      <StatsBar
        stats={[
          { value: hashtags.length, label: "Hashtags Tracked" },
          { value: fmt(maxHt), label: "Top Hashtag Views" },
        ]}
      />
      <div className="hashtag-list">
        {hashtags.map((h, i) => {
          const tag = h.hashtag || h.tag || h.name || "";
          const views = htViews(h);
          return (
            <div className="hashtag-row" key={i}>
              <span className="hashtag-tag">#{tag}</span>
              <div className="hashtag-bar">
                <div
                  className="hashtag-bar-fill"
                  style={{ width: animate ? (views / maxHt) * 100 + "%" : "0" }}
                />
              </div>
              <span className="hashtag-views">{fmt(views)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
