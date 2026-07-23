import { useState } from "react";
import type { ResultsData, TabKey } from "../types";
import { VideosTab } from "./VideosTab";
import { OutliersTab } from "./OutliersTab";
import { HashtagsTab } from "./HashtagsTab";
import { SoundsTab } from "./SoundsTab";

export function ResultsView({ data }: { data: ResultsData }) {
  const videos = data.videos || [];
  const outliers = data.outliers || [];
  const hashtags = data.hashtags || [];
  const sounds = data.sounds || [];
  const agent = data.agent || {};
  const keywords = agent.keywords || [];
  const intent = agent.intent || "";
  const createdAt = agent.created_at || "";

  const title = keywords.length ? keywords.slice(0, 3).join(", ") : "Niche Research";

  const [tab, setTab] = useState<TabKey>("videos");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "videos", label: "Top Videos", count: videos.length },
    { key: "outliers", label: "Creator Outliers", count: outliers.length },
    { key: "hashtags", label: "Hashtags", count: hashtags.length },
    { key: "sounds", label: "Rising Sounds", count: sounds.length },
  ];

  return (
    <>
      <div className="header">
        <h1>{title}</h1>
        <div className="sub">
          {videos.length} videos analyzed<span className="dot">·</span>
          {outliers.length} creator outliers<span className="dot">·</span>
          {hashtags.length} hashtags<span className="dot">·</span>
          {sounds.length} sounds
          {createdAt && (
            <>
              <span className="dot">·</span>
              {createdAt.slice(0, 10)}
            </>
          )}
        </div>
        {intent && <div className="intent">{intent}</div>}
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            className={"tab" + (tab === t.key ? " active" : "")}
            onClick={() => setTab(t.key)}
            key={t.key}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="content active">
        {tab === "videos" && <VideosTab videos={videos} />}
        {tab === "outliers" && <OutliersTab outliers={outliers} />}
        {tab === "hashtags" && <HashtagsTab hashtags={hashtags} />}
        {tab === "sounds" && <SoundsTab sounds={sounds} />}
      </div>
    </>
  );
}
