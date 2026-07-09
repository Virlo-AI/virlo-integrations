# Example — Creator deep-dive (Satellite)

For "tell me about this creator" or "why did this video pop?"

## User prompt

> "Tell me about the TikTok creator @londonfitguy — how are they performing, and are they on other platforms?"

## Agent steps

### 1. Look up the creator ($0.50)

```bash
curl "https://api.virlo.ai/v1/satellite/creator/tiktok/londonfitguy?include=videos,outliers&cross_links=true&max_videos=50" \
  -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)"
```

This returns a `job_id`. Poll until complete:

```bash
curl "https://api.virlo.ai/v1/satellite/creator/status/{job_id}" -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)"
```

Creator lookups finish in ~20–60s.

### 2. Present

- Headline stats (followers, avg views, engagement rate).
- **Their outlier videos, ranked by weighted virality score** — the posts that punched above their audience size.
- `cross_links.discovered` — the same creator found on YouTube, Instagram, Spotify, X.
- Save the `run_id` — re-read it free forever via `GET /v1/satellite/runs/{run_id}`.

### 3. (Optional) Analyze their standout video ($0.50)

```bash
curl -X POST "https://api.virlo.ai/v1/satellite/video-outlier" \
  -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)" \
  -H "Content-Type: application/json" \
  -d '{ "url": "https://www.tiktok.com/@londonfitguy/video/...", "platform": "tiktok" }'
```

Poll `GET /v1/satellite/video-outlier/status/{job_id}`, then explain how that video performed vs. the creator's own baseline.

## Total cost

$0.50 (creator lookup) + optional $0.50 (video outlier) = **$0.50–$1.00**. Re-reads are free forever via the persisted `run_id`.
