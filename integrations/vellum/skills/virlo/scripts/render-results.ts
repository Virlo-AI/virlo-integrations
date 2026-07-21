#!/usr/bin/env bun
/**
 * render-results.ts — Generate a standalone HTML results viewer from a Virlo agent run.
 *
 * Fetches all result endpoints (videos, outliers, hashtags, sounds), then emits a
 * self-contained HTML file with a dark editorial UI — tabbed navigation, video card
 * grid with thumbnails, creator outlier cards, hashtag bar chart, rising sounds.
 *
 * No external dependencies. No CDN imports. Works in any browser.
 *
 * Usage:
 *   bun render-results.ts --agent-id <uuid> [--output path/to/results.html] [--title "My Research"]
 *
 * Cost: Free (reads only — all result endpoints are free reads).
 */

import { virloFetch } from "./virlo-client.ts";

interface Args {
  agentId: string;
  output?: string;
  title?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const agentId = get("--agent-id");
  if (!agentId) {
    console.error('Usage: bun render-results.ts --agent-id <uuid> [--output path.html] [--title "My Research"]');
    process.exit(1);
  }
  return { agentId, output: get("--output"), title: get("--title") };
}

interface Video {
  url: string; thumbnail_url?: string; description?: string; platform?: string;
  views?: number; likes?: number; shares?: number; comments?: number; bookmarks?: number;
  publish_date?: string;
  author?: { username?: string; followers?: number; avatar_url?: string; verified?: boolean };
  intelligence?: { content_format?: string; visual_format?: string; primary_topic?: string; secondary_topics?: string[]; hook_type?: string; visual_hook_type?: string };
}
interface Outlier {
  creator_url?: string; creator_avatar_url?: string; follower_count?: number;
  avg_views?: number; top_video_views?: number; outlier_ratio?: number;
  weighted_score?: number; breakout_video_count?: number; platform?: string;
  creator_topics?: string[]; matching_topics?: string[]; posts_per_week?: number;
  content_angle?: string; avg_engagement_rate?: number;
}
interface Hashtag { hashtag?: string; tag?: string; name?: string; views?: number; total_views?: number; }
interface Sound { sound_name?: string; name?: string; title?: string; platform?: string; }

function fmt(n: number | undefined): string {
  if (!n || n < 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}
function esc(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function extractList(data: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.data && Array.isArray(obj.data)) return obj.data;
    for (const k of keys) { if (obj[k] && Array.isArray(obj[k])) return obj[k] as unknown[]; }
  }
  return [];
}

function generateHTML(videos: Video[], outliers: Outlier[], hashtags: Hashtag[], sounds: Sound[], title: string, meta: { keywords?: string[]; intent?: string; createdAt?: string }): string {
  const videoCards = videos.map((v, i) => {
    const a = v.author || {}; const intel = v.intelligence || {};
    const tags: string[] = [];
    if (intel.visual_format) tags.push(`<span class="tag format">${esc(intel.visual_format.replace(/_/g, " "))}</span>`);
    if (intel.primary_topic) tags.push(`<span class="tag">${esc(intel.primary_topic)}</span>`);
    if (intel.secondary_topics) intel.secondary_topics.slice(0, 2).forEach(t => tags.push(`<span class="tag">${esc(t)}</span>`));
    const thumb = v.thumbnail_url ? `<img class="thumb" src="${esc(v.thumbnail_url)}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('no-thumb')">` : "";
    const noThumb = !v.thumbnail_url ? "no-thumb" : "";
    const avatar = a.avatar_url ? `<img class="avatar" src="${esc(a.avatar_url)}" onerror="this.style.display='none'">` : "";
    return `<a class="video-card" href="${esc(v.url)}" target="_blank" rel="noopener"><div class="thumb-wrap ${noThumb}">${thumb}<div class="badge-row"><span class="platform-badge ${esc(v.platform || "")}">${esc(v.platform || "")}</span><span class="rank-badge">#${i + 1}</span></div></div><div class="card-body"><p class="desc">${esc((v.description || "").slice(0, 200))}</p><div class="creator-row">${avatar}<span>@${esc(a.username || "")}</span>${a.followers ? `<span class="followers">· ${fmt(a.followers)}</span>` : ""}</div><div class="stats-row"><span>▶ ${fmt(v.views)}</span><span>♥ ${fmt(v.likes)}</span>${v.shares ? `<span>↥ ${fmt(v.shares)}</span>` : ""}${v.bookmarks ? `<span>🔖 ${fmt(v.bookmarks)}</span>` : ""}</div>${tags.length ? `<div class="tag-row">${tags.join("")}</div>` : ""}</div></a>`;
  }).join("\n");

  const outlierCards = outliers.map((o) => {
    const handle = o.creator_url?.split("/").filter(Boolean).pop()?.replace(/^[(@]/, "") || "Creator";
    const avatar = o.creator_avatar_url ? `<img class="outlier-avatar" src="${esc(o.creator_avatar_url)}" onerror="this.style.display='none'">` : "";
    const topics = (o.creator_topics || []).map(t => `<span class="topic-tag ${o.matching_topics?.includes(t) ? "match" : ""}">${esc(t)}</span>`).join("");
    return `<a class="outlier-card" href="${esc(o.creator_url)}" target="_blank" rel="noopener"><div class="outlier-header">${avatar}<div><div class="outlier-name">${esc(handle)}</div><div class="outlier-meta">${esc(o.platform || "")} · ${fmt(o.follower_count)} followers · ${o.posts_per_week || 0}/wk</div></div></div><div class="outlier-stats"><div class="outlier-stat"><div class="val">${fmt(o.avg_views)}</div><div class="lbl">Avg Views</div></div><div class="outlier-stat"><div class="val">${fmt(o.top_video_views)}</div><div class="lbl">Top Video</div></div><div class="outlier-stat"><div class="val">${o.outlier_ratio || 0}x</div><div class="lbl">Outlier</div></div><div class="outlier-stat"><div class="val">${o.breakout_video_count || 0}</div><div class="lbl">Breakouts</div></div></div>${o.content_angle ? `<div class="outlier-angle">${esc(o.content_angle)}</div>` : ""}${topics ? `<div class="topic-tags">${topics}</div>` : ""}</a>`;
  }).join("\n");

  const maxHt = Math.max(...hashtags.map(h => h.views || h.total_views || 0), 1);
  const hashtagRows = hashtags.map((h) => {
    const tag = h.hashtag || h.tag || h.name || ""; const views = h.views || h.total_views || 0;
    return `<div class="hashtag-row"><span class="hashtag-tag">#${esc(tag)}</span><div class="hashtag-bar"><div class="hashtag-bar-fill" style="width:${(views / maxHt) * 100}%"></div></div><span class="hashtag-views">${fmt(views)}</span></div>`;
  }).join("\n");

  const soundCards = sounds.map((s) => {
    const name = s.sound_name || s.name || s.title || "";
    return `<div class="sound-card"><span class="sound-icon">♪</span><span class="sound-name">${esc(name)}</span><span class="sound-platform">${esc(s.platform || "")}</span></div>`;
  }).join("\n");

  const kw = meta.keywords?.length ? meta.keywords.join(", ") : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title>
<style>
:root{--bg:#0a0a0b;--surface:#141416;--border:rgba(255,255,255,0.06);--border-h:rgba(255,255,255,0.14);--text:#e4e4e7;--text-2:#a1a1aa;--text-m:#71717a;--text-d:#52525b;--accent:#34d399;--accent-d:rgba(52,211,153,0.15);--r:12px;--rs:8px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,"DM Sans",system-ui,sans-serif;background:var(--bg);color:var(--text);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
.header{padding:max(24px,env(safe-area-inset-top)) 24px 20px;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(10,10,11,0.85);backdrop-filter:blur(20px);z-index:100}
.header h1{font-size:22px;font-weight:700;letter-spacing:-0.02em;margin-bottom:4px}
.header .sub{font-size:12px;color:var(--text-m)}.header .sub .dot{margin:0 6px;opacity:.4}
.header .intent{font-size:12px;color:var(--text-d);margin-top:6px;font-style:italic}
.tabs{display:flex;gap:2px;padding:0 24px;border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:10px 16px;font-size:13px;font-weight:500;color:var(--text-m);background:none;border:none;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:color .15s,border-color .15s}
.tab:hover{color:var(--text-2)}.tab.active{color:var(--text);border-bottom-color:var(--accent)}
.content{padding:20px 24px 80px;display:none}.content.active{display:block}
.stats-bar{display:flex;gap:24px;margin-bottom:24px;flex-wrap:wrap}
.stat{display:flex;flex-direction:column;gap:2px}.stat .value{font-size:20px;font-weight:700;letter-spacing:-0.02em}.stat .label{font-size:11px;color:var(--text-m);text-transform:uppercase;letter-spacing:0.05em}
.video-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.video-card{background:var(--surface);border-radius:var(--r);overflow:hidden;text-decoration:none;color:inherit;border:1px solid var(--border);transition:transform .15s,border-color .15s,box-shadow .15s;display:flex;flex-direction:column}
.video-card:hover{transform:translateY(-3px);border-color:var(--border-h);box-shadow:0 8px 30px rgba(0,0,0,0.4)}
.thumb-wrap{position:relative;aspect-ratio:16/10;background:linear-gradient(135deg,#1a1a1c,#0f0f11);overflow:hidden;flex-shrink:0}
.thumb-wrap.no-thumb{display:flex;align-items:center;justify-content:center}.thumb-wrap.no-thumb::after{content:"No preview";color:var(--text-d);font-size:12px}
.thumb{width:100%;height:100%;object-fit:cover;display:block}
.badge-row{position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between}
.platform-badge{padding:3px 8px;border-radius:16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);color:#fff}
.platform-badge.instagram{color:#e1306c}.platform-badge.youtube{color:#ff0000}
.rank-badge{background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);padding:3px 10px;border-radius:16px;font-size:12px;font-weight:700;color:#fff}
.card-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:10px;flex:1}
.desc{font-size:12.5px;line-height:1.45;color:var(--text);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.creator-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2)}
.avatar{width:20px;height:20px;border-radius:50%;object-fit:cover;flex-shrink:0}
.followers{color:var(--text-d)}
.stats-row{display:flex;gap:14px;font-size:11px;color:var(--text-m);flex-wrap:wrap}.stats-row span{white-space:nowrap}
.tag-row{display:flex;flex-wrap:wrap;gap:4px;margin-top:auto}
.tag{font-size:10px;padding:2px 7px;border-radius:5px;background:rgba(255,255,255,0.06);color:var(--text-2);text-transform:capitalize}
.tag.format{background:var(--accent-d);color:var(--accent)}
.outlier-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border);padding:20px;text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:12px;transition:border-color .15s,transform .15s}
.outlier-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.outlier-header{display:flex;align-items:center;gap:12px}
.outlier-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0}
.outlier-name{font-size:15px;font-weight:600}.outlier-meta{font-size:12px;color:var(--text-m)}
.outlier-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.outlier-stat .val{font-size:16px;font-weight:700;letter-spacing:-0.01em}.outlier-stat .lbl{font-size:10px;color:var(--text-m);text-transform:uppercase;letter-spacing:0.04em}
.outlier-angle{font-size:13px;color:var(--text-2);line-height:1.5;padding:12px;background:rgba(255,255,255,0.03);border-radius:var(--rs);border-left:2px solid var(--accent)}
.topic-tags{display:flex;flex-wrap:wrap;gap:4px}
.topic-tag{font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,0.06);color:var(--text-2)}
.topic-tag.match{background:var(--accent-d);color:var(--accent)}
.hashtag-list{display:flex;flex-direction:column;gap:8px}
.hashtag-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface);border-radius:var(--rs);border:1px solid var(--border);transition:border-color .15s}
.hashtag-row:hover{border-color:var(--border-h)}
.hashtag-tag{font-size:14px;font-weight:600;color:var(--accent)}
.hashtag-bar{flex:1;height:6px;margin:0 16px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden}
.hashtag-bar-fill{height:100%;background:linear-gradient(90deg,var(--accent),rgba(52,211,153,0.4));border-radius:3px}
.hashtag-views{font-size:13px;font-weight:600;color:var(--text-2);min-width:60px;text-align:right}
.sound-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.sound-card{padding:14px 16px;background:var(--surface);border-radius:var(--rs);border:1px solid var(--border);display:flex;align-items:center;gap:10px}
.sound-icon{font-size:18px;opacity:.5}.sound-name{font-size:13px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sound-platform{font-size:10px;text-transform:uppercase;color:var(--text-d)}
.empty{text-align:center;padding:60px 20px;color:var(--text-m)}.empty h3{font-size:16px;margin-bottom:6px;color:var(--text-2)}
@media(max-width:600px){.video-grid{grid-template-columns:1fr}.outlier-stats{grid-template-columns:repeat(2,1fr)}.content{padding:16px 16px 60px}.header{padding:max(16px,env(safe-area-inset-top)) 16px 16px}.tabs{padding:0 16px}}
</style></head><body>
<div class="header"><h1>${esc(title)}</h1><div class="sub">${videos.length} videos analyzed<span class="dot">·</span>${outliers.length} creator outliers<span class="dot">·</span>${hashtags.length} hashtags<span class="dot">·</span>${sounds.length} sounds${meta.createdAt ? `<span class="dot">·</span>${esc(meta.createdAt.slice(0, 10))}` : ""}</div>${meta.intent ? `<div class="intent">${esc(meta.intent)}</div>` : ""}</div>
<div class="tabs"><button class="tab active" data-tab="videos">Top Videos (${videos.length})</button><button class="tab" data-tab="outliers">Creator Outliers (${outliers.length})</button><button class="tab" data-tab="hashtags">Hashtags (${hashtags.length})</button><button class="tab" data-tab="sounds">Rising Sounds (${sounds.length})</button></div>
<div class="content active" id="videos"><div class="stats-bar"><div class="stat"><span class="value">${videos.length}</span><span class="label">Videos Found</span></div><div class="stat"><span class="value">${fmt(Math.max(...videos.map(v => v.views || 0), 0))}</span><span class="label">Top Views</span></div><div class="stat"><span class="value">${videos.filter(v => v.platform === "tiktok").length}</span><span class="label">TikTok</span></div><div class="stat"><span class="value">${videos.filter(v => v.platform === "instagram").length}</span><span class="label">Instagram</span></div></div><div class="video-grid">${videoCards || '<div class="empty"><h3>No videos found</h3></div>'}</div></div>
<div class="content" id="outliers">${outliers.length ? `<div class="stats-bar"><div class="stat"><span class="value">${outliers.length}</span><span class="label">Rising Creators</span></div><div class="stat"><span class="value">${fmt(Math.max(...outliers.map(o => o.outlier_ratio || 0)))}x</span><span class="label">Top Outlier Ratio</span></div></div><div class="video-grid" style="grid-template-columns:repeat(auto-fill,minmax(360px,1fr))">${outlierCards}</div>` : '<div class="empty"><h3>No creator outliers</h3></div>'}</div>
<div class="content" id="hashtags">${hashtags.length ? `<div class="stats-bar"><div class="stat"><span class="value">${hashtags.length}</span><span class="label">Hashtags Tracked</span></div><div class="stat"><span class="value">${fmt(maxHt)}</span><span class="label">Top Hashtag Views</span></div></div><div class="hashtag-list">${hashtagRows}</div>` : '<div class="empty"><h3>No hashtags</h3></div>'}</div>
<div class="content" id="sounds">${sounds.length ? `<div class="stats-bar"><div class="stat"><span class="value">${sounds.length}</span><span class="label">Rising Sounds</span></div></div><div class="sound-grid">${soundCards}</div>` : '<div class="empty"><h3>No sounds</h3></div>'}</div>
<script>document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.content').forEach(x=>x.classList.remove('active'));t.classList.add('active');document.getElementById(t.dataset.tab).classList.add('active');}));</script>
</body></html>`;
}

async function main() {
  const { agentId, output, title } = parseArgs();
  console.error(`Fetching all results for agent ${agentId}...`);

  const [agentMeta, videosRaw, outliersRaw, hashtagsRaw, soundsRaw] = await Promise.all([
    virloFetch(`/agents/${agentId}`) as Promise<Record<string, unknown>>,
    virloFetch(`/agents/${agentId}/videos?order_by=views&sort=desc&limit=50`) as Promise<unknown>,
    virloFetch(`/agents/${agentId}/creators/outliers?order_by=weighted_score&limit=20`) as Promise<unknown>,
    virloFetch(`/agents/${agentId}/hashtags?limit=50`) as Promise<unknown>,
    virloFetch(`/agents/${agentId}/sounds?sort=rising&limit=30`) as Promise<unknown>,
  ]);

  const videos = extractList(videosRaw, "videos", "items") as Video[];
  const outliers = extractList(outliersRaw, "outliers", "items") as Outlier[];
  const hashtags = extractList(hashtagsRaw, "hashtags", "items") as Hashtag[];
  const sounds = extractList(soundsRaw, "sounds", "items") as Sound[];

  console.error(`  ${videos.length} videos, ${outliers.length} outliers, ${hashtags.length} hashtags, ${sounds.length} sounds`);

  const htmlTitle = title || `Virlo Research — ${agentMeta.keywords?.length ? (agentMeta.keywords as string[]).slice(0, 3).join(", ") : "Niche Search"}`;
  const html = generateHTML(videos, outliers, hashtags, sounds, htmlTitle, {
    keywords: agentMeta.keywords as string[] | undefined,
    intent: agentMeta.intent as string | undefined,
    createdAt: agentMeta.created_at as string | undefined,
  });

  const outPath = output || `virlo-results-${agentId.slice(0, 8)}.html`;
  const { writeFileSync } = await import("node:fs");
  writeFileSync(outPath, html);
  console.log(outPath);
  console.error(`\nViewer saved to: ${outPath}`);
  console.error(`Open it in a browser, or share the file.`);
}

main().catch((err) => { console.error(`Error: ${err.message}`); process.exit(1); });
