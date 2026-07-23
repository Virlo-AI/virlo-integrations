/**
 * Shapes of the payload returned by the plugin route `/x/plugins/virlo/results`.
 * Everything is snake_case to mirror the Virlo API verbatim. Fields are optional
 * because the route passes results through untouched and different agents/platforms
 * populate different subsets.
 */

export interface Author {
  username?: string;
  followers?: number;
  avatar_url?: string;
}

export interface Intelligence {
  visual_format?: string;
  primary_topic?: string;
  secondary_topics?: string[];
}

export interface Video {
  url?: string;
  platform?: string;
  description?: string;
  thumbnail_url?: string;
  views?: number;
  likes?: number;
  shares?: number;
  bookmarks?: number;
  author?: Author;
  intelligence?: Intelligence;
}

export interface Outlier {
  creator_url?: string;
  creator_avatar_url?: string;
  platform?: string;
  follower_count?: number;
  posts_per_week?: number;
  avg_views?: number;
  top_video_views?: number;
  outlier_ratio?: number;
  breakout_video_count?: number;
  content_angle?: string;
  creator_topics?: string[];
  matching_topics?: string[];
}

export interface Hashtag {
  hashtag?: string;
  tag?: string;
  name?: string;
  views?: number;
  total_views?: number;
}

export interface Sound {
  sound_name?: string;
  name?: string;
  title?: string;
  platform?: string;
}

export interface Agent {
  keywords?: string[];
  intent?: string;
  created_at?: string;
}

export interface ResultsData {
  agent?: Agent;
  videos?: Video[];
  outliers?: Outlier[];
  hashtags?: Hashtag[];
  sounds?: Sound[];
}

export type TabKey = "videos" | "outliers" | "hashtags" | "sounds";

/** One entry in the list returned by `/x/plugins/virlo/agents`. */
export interface AgentSummary {
  id?: string;
  agent_id?: string;
  name?: string;
  intent?: string;
  keywords?: string[];
  platforms?: string[];
  is_recurring?: boolean;
  cadence?: string;
  status?: string;
  finalized?: boolean;
  created_at?: string;
}

/** Best available id for an agent, tolerating either field name. */
export function agentId(a: AgentSummary): string {
  return a.id || a.agent_id || "";
}
