import { render } from "react";
import { useState, useEffect, useCallback } from "react";
import "./styles.css";

// --- Types ---
interface Video {
  url: string; thumbnail_url?: string; description?: string; platform?: string;
  views?: number; likes?: number; shares?: number; comments?: number; bookmarks?: number;
  author?: { username?: string; followers?: number; avatar_url?: string; verified?: boolean };
  intelligence?: { content_format?: string; visual_format?: string; primary_topic?: string; secondary_topics?: string[]; hook_type?: string };
}
interface Outlier {
  creator_url?: string; creator_avatar_url?: string; follower_count?: number;
  avg_views?: number; top_video_views?: number; outlier_ratio?: number;
  breakout_video_count?: number; platform?: string;
  creator_topics?: string[]; matching_topics?: string[]; posts_per_week?: number;
  content_angle?: string;
}
interface Hashtag { hashtag?: string; tag?: string; name?: string; views?: number; total_views?: number; }
interface Sound { sound_name?: string; name?: string; title?: string; platform?: string; }
interface AgentMeta { keywords?: string[]; intent?: string; created_at?: string; }
interface ResultsData {
  agent: AgentMeta; videos: Video[]; outliers: Outlier[]; hashtags: Hashtag[]; sounds: Sound[];
}

// --- Helpers ---
function fmt(n: number | undefined): string {
  if (!n || n < 0) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

// --- Main App ---
function App() {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState("");
  const [showInput, setShowInput] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [checking, setChecking] = useState(true);

  const loadResults = useCallback(async (id: string) => {
    setShowInput(false);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/x/plugins/virlo/results?agent_id=" + encodeURIComponent(id));
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as Record<string, string>));
        throw new Error(err.error || "HTTP " + res.status);
      }
      const json: ResultsData = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch results.");
      setLoading(false);
    }
  }, []);

  // Auto-load: check URL param first, then check for pending agent_id staged by assistant
  useEffect(() => {
    // 1. URL param (direct link with ?agent_id=...)
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get("agent_id");
    if (urlId) {
      setAgentId(urlId);
      setChecking(false);
      loadResults(urlId);
      return;
    }
    // 2. Pending check — assistant POSTs agent_id to route before opening app
    fetch("/x/plugins/virlo/results?pending=1")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { agent_id?: string | null } | null) => {
        if (data?.agent_id) {
          setAgentId(data.agent_id);
          setChecking(false);
          loadResults(data.agent_id);
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [loadResults]);

  if (checking) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (showInput && !data && !loading) {
    return (
      <div className="input-screen">
        <h1>Virlo Results Viewer</h1>
        <p>Enter a Content Research Agent ID to browse videos, creator outliers, hashtags, and rising sounds.</p>
        <div className="input-wrap">
          <input
            placeholder="Agent UUID (e.g. 6f42116d-...)"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && agentId.trim()) loadResults(agentId.trim()); }}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={() => agentId.trim() && loadResults(agentId.trim())}
            disabled={!agentId.trim()}
          >
            Load Results
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Fetching all result endpoints...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h3>Failed to load</h3>
        <p>{error}</p>
        <button onClick={() => { setShowInput(true); setError(null); setData(null); setChecking(false); }}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const videos = data.videos || [];
  const outliers = data.outliers || [];
  const hashtags = data.hashtags || [];
  const sounds = data.sounds || [];
  const agent = data.agent || {};
  const keywords = agent.keywords || [];
  const intent = agent.intent || "";
  const createdAt = agent.created_at || "";
  const title = keywords.length ? keywords.slice(0, 3).join(", ") : "Niche Research";

  return (
    <div>
      <div className="header">
        <h1>{title}</h1>
        <div className="sub">
          {videos.length} videos analyzed
          <span className="dot">·</span>
          {outliers.length} creator outliers
          <span className="dot">·</span>
          {hashtags.length} hashtags
          <span className="dot">·</span>
          {sounds.length} sounds
          {createdAt && <><span className="dot">·</span>{createdAt.slice(0, 10)}</>}
        </div>
        {intent && <div className="intent">{intent}</div>}
      </div>
      <div className="tabs">
        <button className={`tab ${activeTab === "videos" ? "active" : ""}`} onClick={() => setActiveTab("videos")}>
          Top Videos ({videos.length})
        </button>
        <button className={`tab ${activeTab === "outliers" ? "active" : ""}`} onClick={() => setActiveTab("outliers")}>
          Creator Outliers ({outliers.length})
        </button>
        <button className={`tab ${activeTab === "hashtags" ? "active" : ""}`} onClick={() => setActiveTab("hashtags")}>
          Hashtags ({hashtags.length})
        </button>
        <button className={`tab ${activeTab === "sounds" ? "active" : ""}`} onClick={() => setActiveTab("sounds")}>
          Rising Sounds ({sounds.length})
        </button>
      </div>
      {activeTab === "videos" && <VideosTab videos={videos} />}
      {activeTab === "outliers" && <OutliersTab outliers={outliers} />}
      {activeTab === "hashtags" && <HashtagsTab hashtags={hashtags} />}
      {activeTab === "sounds" && <SoundsTab sounds={sounds} />}
    </div>
  );
}

// --- Video Card ---
function VideoCard({ v, rank }: { v: Video; rank: number }) {
  const a = v.author || {};
  const intel = v.intelligence || {};
  const tags: string[] = [];
  if (intel.visual_format) tags.push(intel.visual_format.replace(/_/g, " "));
  if (intel.primary_topic) tags.push(intel.primary_topic);
  if (intel.secondary_topics) intel.secondary_topics.slice(0, 2).forEach((t) => tags.push(t));

  return (
    <a className="video-card" href={v.url} target="_blank" rel="noopener noreferrer">
      <div className={`thumb-wrap ${!v.thumbnail_url ? "no-thumb" : ""}`}>
        {v.thumbnail_url && <img className="thumb" src={v.thumbnail_url} loading="lazy" />}
        <div className="badge-row">
          <span className={`platform-badge ${v.platform || ""}`}>{v.platform || ""}</span>
          <span className="rank-badge">#{rank}</span>
        </div>
      </div>
      <div className="card-body">
        <p className="desc">{(v.description || "").slice(0, 200)}</p>
        <div className="creator-row">
          {a.avatar_url && <img className="avatar" src={a.avatar_url} />}
          <span>@{a.username || ""}</span>
          {a.followers ? <span className="followers">· {fmt(a.followers)}</span> : null}
        </div>
        <div className="stats-row">
          <span>▶ {fmt(v.views)}</span>
          <span>♥ {fmt(v.likes)}</span>
          {v.shares ? <span>↥ {fmt(v.shares)}</span> : null}
          {v.bookmarks ? <span>🔖 {fmt(v.bookmarks)}</span> : null}
        </div>
        {tags.length > 0 && (
          <div className="tag-row">
            {tags.map((t, i) => (
              <span key={i} className={`tag ${i === 0 && intel.visual_format ? "format" : ""}`}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

function VideosTab({ videos }: { videos: Video[] }) {
  if (!videos.length) return <div className="empty"><h3>No videos found</h3></div>;
  const topViews = Math.max(...videos.map((v) => v.views || 0), 0);
  const tiktokCount = videos.filter((v) => v.platform === "tiktok").length;
  const igCount = videos.filter((v) => v.platform === "instagram").length;
  return (
    <>
      <div className="stats-bar">
        <div className="stat"><span className="value">{videos.length}</span><span className="label">Videos Found</span></div>
        <div className="stat"><span className="value">{fmt(topViews)}</span><span className="label">Top Views</span></div>
        <div className="stat"><span className="value">{tiktokCount}</span><span className="label">TikTok</span></div>
        <div className="stat"><span className="value">{igCount}</span><span className="label">Instagram</span></div>
      </div>
      <div className="video-grid">
        {videos.map((v, i) => <VideoCard key={i} v={v} rank={i + 1} />)}
      </div>
    </>
  );
}

// --- Outlier Card ---
function OutlierCard({ o }: { o: Outlier }) {
  const handle = (o.creator_url || "").split("/").filter(Boolean).pop()?.replace(/^[(@]/, "") || "Creator";
  const topics = o.creator_topics || [];
  const matching = o.matching_topics || [];
  return (
    <a className="outlier-card" href={o.creator_url} target="_blank" rel="noopener noreferrer">
      <div className="outlier-header">
        {o.creator_avatar_url && <img className="outlier-avatar" src={o.creator_avatar_url} />}
        <div>
          <div className="outlier-name">{handle}</div>
          <div className="outlier-meta">{o.platform || ""} · {fmt(o.follower_count)} followers · {o.posts_per_week || 0}/wk</div>
        </div>
      </div>
      <div className="outlier-stats">
        <div className="outlier-stat"><div className="val">{fmt(o.avg_views)}</div><div className="lbl">Avg Views</div></div>
        <div className="outlier-stat"><div className="val">{fmt(o.top_video_views)}</div><div className="lbl">Top Video</div></div>
        <div className="outlier-stat"><div className="val">{o.outlier_ratio || 0}x</div><div className="lbl">Outlier</div></div>
        <div className="outlier-stat"><div className="val">{o.breakout_video_count || 0}</div><div className="lbl">Breakouts</div></div>
      </div>
      {o.content_angle && <div className="outlier-angle">{o.content_angle}</div>}
      {topics.length > 0 && (
        <div className="topic-tags">
          {topics.map((t, i) => (
            <span key={i} className={`topic-tag ${matching.includes(t) ? "match" : ""}`}>{t}</span>
          ))}
        </div>
      )}
    </a>
  );
}

function OutliersTab({ outliers }: { outliers: Outlier[] }) {
  if (!outliers.length) return <div className="empty"><h3>No creator outliers</h3></div>;
  const topRatio = Math.max(...outliers.map((o) => o.outlier_ratio || 0), 0);
  return (
    <>
      <div className="stats-bar">
        <div className="stat"><span className="value">{outliers.length}</span><span className="label">Rising Creators</span></div>
        <div className="stat"><span className="value">{fmt(topRatio)}x</span><span className="label">Top Outlier Ratio</span></div>
      </div>
      <div className="video-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))" }}>
        {outliers.map((o, i) => <OutlierCard key={i} o={o} />)}
      </div>
    </>
  );
}

// --- Hashtags Tab ---
function HashtagsTab({ hashtags }: { hashtags: Hashtag[] }) {
  if (!hashtags.length) return <div className="empty"><h3>No hashtags</h3></div>;
  const maxHt = Math.max(...hashtags.map((h) => h.views || h.total_views || 0), 1);
  return (
    <>
      <div className="stats-bar">
        <div className="stat"><span className="value">{hashtags.length}</span><span className="label">Hashtags Tracked</span></div>
        <div className="stat"><span className="value">{fmt(maxHt)}</span><span className="label">Top Hashtag Views</span></div>
      </div>
      <div className="hashtag-list">
        {hashtags.map((h, i) => {
          const tag = h.hashtag || h.tag || h.name || "";
          const views = h.views || h.total_views || 0;
          return (
            <div key={i} className="hashtag-row">
              <span className="hashtag-tag">#{tag}</span>
              <div className="hashtag-bar">
                <div className="hashtag-bar-fill" style={{ width: `${(views / maxHt) * 100}%` }} />
              </div>
              <span className="hashtag-views">{fmt(views)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// --- Sounds Tab ---
function SoundsTab({ sounds }: { sounds: Sound[] }) {
  if (!sounds.length) return <div className="empty"><h3>No sounds</h3></div>;
  return (
    <>
      <div className="stats-bar">
        <div className="stat"><span className="value">{sounds.length}</span><span className="label">Rising Sounds</span></div>
      </div>
      <div className="sound-grid">
        {sounds.map((s, i) => {
          const name = s.sound_name || s.name || s.title || "";
          return (
            <div key={i} className="sound-card">
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

render(<App />, document.getElementById("app")!);
