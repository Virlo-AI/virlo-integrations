import type { Outlier } from "../types";
import { fmt } from "../lib/format";
import { StatsBar } from "./StatsBar";

function handleFromUrl(url?: string): string {
  return (
    (url || "").split("/").filter(Boolean).pop()?.replace(/^[(@]/, "") ||
    "Creator"
  );
}

function OutlierCard({ outlier }: { outlier: Outlier }) {
  const handle = handleFromUrl(outlier.creator_url);
  const matching = outlier.matching_topics || [];

  return (
    <a
      className="outlier-card"
      href={outlier.creator_url}
      target="_blank"
      rel="noopener"
    >
      <div className="outlier-header">
        {outlier.creator_avatar_url && (
          <img
            className="outlier-avatar"
            src={outlier.creator_avatar_url}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div>
          <div className="outlier-name">{handle}</div>
          <div className="outlier-meta">
            {outlier.platform || ""} · {fmt(outlier.follower_count)} followers ·{" "}
            {outlier.posts_per_week || 0}/wk
          </div>
        </div>
      </div>
      <div className="outlier-stats">
        <div className="outlier-stat">
          <div className="val">{fmt(outlier.avg_views)}</div>
          <div className="lbl">Avg Views</div>
        </div>
        <div className="outlier-stat">
          <div className="val">{fmt(outlier.top_video_views)}</div>
          <div className="lbl">Top Video</div>
        </div>
        <div className="outlier-stat">
          <div className="val">{outlier.outlier_ratio || 0}x</div>
          <div className="lbl">Outlier</div>
        </div>
        <div className="outlier-stat">
          <div className="val">{outlier.breakout_video_count || 0}</div>
          <div className="lbl">Breakouts</div>
        </div>
      </div>
      {outlier.content_angle && (
        <div className="outlier-angle">{outlier.content_angle}</div>
      )}
      {(outlier.creator_topics || []).length > 0 && (
        <div className="topic-tags">
          {(outlier.creator_topics || []).map((t, i) => (
            <span
              className={"topic-tag" + (matching.includes(t) ? " match" : "")}
              key={i}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

export function OutliersTab({ outliers }: { outliers: Outlier[] }) {
  if (!outliers.length)
    return (
      <div className="empty">
        <h3>No creator outliers</h3>
      </div>
    );

  const topRatio = Math.max(...outliers.map((o) => o.outlier_ratio || 0), 0);

  return (
    <>
      <StatsBar
        stats={[
          { value: outliers.length, label: "Rising Creators" },
          { value: fmt(topRatio) + "x", label: "Top Outlier Ratio" },
        ]}
      />
      <div
        className="video-grid"
        style={{ gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))" }}
      >
        {outliers.map((o, i) => (
          <OutlierCard outlier={o} key={i} />
        ))}
      </div>
    </>
  );
}
