# Golden Prompts

These are the prompts the Vellum + Virlo integration **must handle well**. Treat them as acceptance criteria: a healthy plugin answers every one of these end-to-end, using the weighted virality score and finalizing on `finalized: true`.

## Primary flow — "what's viral in my niche, and why?"

> **"What kind of content is trending on TikTok in the city of London?"**

Expected behavior: kick off a one-shot Content Research Agent (`POST /v1/agents`, `is_recurring: false`) scoped to `platforms: ["tiktok"]` with specific London-fitness-style multi-word keywords derived from the user's niche. Tell the user it takes ~15–20 min, then finalize and summarize. (For a live regional pulse without a scrape, `GET /v1/trends/emerging?region=gb` is the instant path.)

### Follow-ups the assistant must handle after a run finalizes

- **"What did you find on the latest run?"** → summarize `analysis/latest` (themes with confidence + evidence) and the top videos by weighted score.
- **"What kind of content is trending?"** → `trends/latest`, grouped by lifecycle (`new`/`rising` first).
- **"What are the most viral videos?"** → `/videos?order_by=views&sort=desc`, but **re-rank and present by weighted virality score**, not raw views.
  - **"Can you send me an example?"** → return a specific video `url` from the top-quartile, with its weighted score and why it worked (hook/format).
- **"What are the winning formats?"** → bucket top-quartile vs bottom-quartile on `hook_type` × `content_format` × `emotional_tone` (needs `data_intelligence_enabled: true`); quote real `hook_text`.
- **"Who are the outlier creators in this category?"** → `/creators/outliers?order_by=weighted_score` — rising creators outperforming their follower count.

## Recurring monitoring

> **"Keep watching London TikTok fitness for me and tell me what changes."**

Expected: create a recurring Content Research Agent (`is_recurring: true`, `cadence: "weekly"`), subscribe to `content_research_agent.run.completed`, and proactively notify on each cycle. Follow trends across cycles via `stable_key`.

## Creator / sound deep-dive

> **"Tell me about this creator @handle — how are they performing?"** → Satellite creator lookup (`cross_links=true`).
> **"Why did this video pop? [paste URL]"** → Satellite video-outlier analysis.
> **"What's happening with this sound? [paste sound]"** → Satellite sound lookup (`trend_analysis=true`).

## Quick pulse

> **"What's emerging on TikTok in the UK right now?"** → `GET /v1/trends/emerging?region=gb` (free).
> **"What's trending today?"** → `GET /v1/trends/digest`.

## Billing edge cases the assistant must handle gracefully

- **Out of credits (402):** APIs *do* return out of credits — surface it plainly and link https://dev.virlo.ai/dashboard/billing. Never fail silently.
- **Low balance:** check `GET /v1/account/balance` (free); when it's < $10, proactively warn. (Don't rely on the `x-balance-remaining` header — it's only present when the balance is resolvable on that request.)
- **Free vs Pro:** all tiering is enforced by Virlo server-side. The plugin never gates — it just relays what the API allows for the user's key.
