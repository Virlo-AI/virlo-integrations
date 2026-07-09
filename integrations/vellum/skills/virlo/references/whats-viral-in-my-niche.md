# Example — "What's going viral in my niche right now, and why?"

The flagship flow. User asks about a niche; the assistant runs a one-shot Content Research Agent, waits for it to finalize, and reports back ranked by weighted virality score.

## User prompt

> "What kind of content is trending on TikTok in the city of London?"

## Agent steps

### 1. Kick off a one-shot Content Research Agent ($0.50)

```bash
curl -X POST "https://api.virlo.ai/v1/agents" \
  -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)" \
  -H "Content-Type: application/json" \
  -d '{
    "is_recurring": false,
    "intent": "understand what content is going viral on TikTok among London-based creators",
    "keywords": ["london tiktok", "things to do in london", "london day in my life", "london food spots"],
    "platforms": ["tiktok"],
    "data_intelligence_enabled": true
  }'
```

Response includes an agent `id`. Tell the user:

> "On it — I've kicked off a London TikTok scan across viral videos, creators, and formats. This takes about 15–20 minutes. I'll come back to you the moment it's finalized."

### 2. Wait for `finalized: true`

Poll `GET /v1/agents/:id` every ~60s (or subscribe to `content_research_agent.run.completed`). Don't block the user — this is where Vellum's always-on model shines.

```bash
curl "https://api.virlo.ai/v1/agents/{id}" -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)"
```

### 3. Read the results (all free)

```bash
# AI analysis: themes, viral tactics, timing, top_10_breakdown
curl "https://api.virlo.ai/v1/agents/{id}/analysis/latest" -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)"

# Detected trends with lifecycle status + evidence videos
curl "https://api.virlo.ai/v1/agents/{id}/trends/latest" -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)"

# The videos — re-rank these by weighted score before presenting
curl "https://api.virlo.ai/v1/agents/{id}/videos?order_by=views&sort=desc&limit=25" -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)"

# Rising creators outperforming their follower count
curl "https://api.virlo.ai/v1/agents/{id}/creators/outliers?order_by=weighted_score&limit=10" -H "Authorization: Bearer $(assistant credentials reveal --service virlo --field api_key)"
```

### 4. Present, ranked by weighted virality score

- Lead with 3–5 breakout videos (weighted score ≥ 25), each with its `url` and a one-line "why it worked" from the hook/format.
- Summarize the `new`/`rising` trends.
- Call out 2–3 outlier creators.
- Bucket the winning formats (`hook_type` × `content_format` × `emotional_tone`) from the top quartile and quote a real `hook_text`.

## Total cost

$0.50 (one-shot agent) + $1.00 (Data Intelligence add-on) = **$1.50**. All retrieval is free.
