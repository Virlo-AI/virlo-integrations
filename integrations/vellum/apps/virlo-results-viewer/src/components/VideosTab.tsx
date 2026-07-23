import type { Video } from "../types";
import { fmt } from "../lib/format";
import { StatsBar } from "./StatsBar";

function VideoCard({ video, rank }: { video: Video; rank: number }) {
  const a = video.author || {};
  const intel = video.intelligence || {};

  const tags: { label: string; format?: boolean }[] = [];
  if (intel.visual_format)
    tags.push({ label: intel.visual_format.replace(/_/g, " "), format: true });
  if (intel.primary_topic) tags.push({ label: intel.primary_topic });
  (intel.secondary_topics || [])
    .slice(0, 2)
    .forEach((t) => tags.push({ label: t }));

  return (
    <a className="video-card" href={video.url} target="_blank" rel="noopener">
      <div className={"thumb-wrap" + (video.thumbnail_url ? "" : " no-thumb")}>
        {video.thumbnail_url && (
          <img
            className="thumb"
            src={video.thumbnail_url}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = "none";
              img.parentElement?.classList.add("no-thumb");
            }}
          />
        )}
        <div className="badge-row">
          <span className={"platform-badge " + (video.platform || "")}>
            {video.platform || ""}
          </span>
          <span className="rank-badge">#{rank}</span>
        </div>
      </div>
      <div className="card-body">
        <p className="desc">{(video.description || "").slice(0, 200)}</p>
        <div className="creator-row">
          {a.avatar_url && (
            <img
              className="avatar"
              src={a.avatar_url}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span>@{a.username || ""}</span>
          {a.followers ? (
            <span className="followers">· {fmt(a.followers)}</span>
          ) : null}
        </div>
        <div className="stats-row">
          <span>▶ {fmt(video.views)}</span>
          <span>♥ {fmt(video.likes)}</span>
          {video.shares ? <span>↥ {fmt(video.shares)}</span> : null}
          {video.bookmarks ? <span>🔖 {fmt(video.bookmarks)}</span> : null}
        </div>
        {tags.length > 0 && (
          <div className="tag-row">
            {tags.map((t, i) => (
              <span className={"tag" + (t.format ? " format" : "")} key={i}>
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

export function VideosTab({ videos }: { videos: Video[] }) {
  if (!videos.length)
    return (
      <div className="empty">
        <h3>No videos found</h3>
      </div>
    );

  const topViews = Math.max(...videos.map((v) => v.views || 0), 0);
  const tiktokCount = videos.filter((v) => v.platform === "tiktok").length;
  const igCount = videos.filter((v) => v.platform === "instagram").length;

  return (
    <>
      <StatsBar
        stats={[
          { value: videos.length, label: "Videos Found" },
          { value: fmt(topViews), label: "Top Views" },
          { value: tiktokCount, label: "TikTok" },
          { value: igCount, label: "Instagram" },
        ]}
      />
      <div className="video-grid">
        {videos.map((v, i) => (
          <VideoCard video={v} rank={i + 1} key={i} />
        ))}
      </div>
    </>
  );
}
