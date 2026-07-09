# Virlo Agent Playbook — Interpreting Results

This is the reasoning layer that turns raw Virlo data into good answers. The hosted, always-current version lives at https://dev.virlo.ai/agent-playbook.txt — read that when in doubt. This bundled copy keeps the Vellum plugin self-contained.

## 1. Rank by weighted virality score, never raw views

Raw view counts lie — a 500K-view post from a 5M-follower account is unremarkable; a 500K-view post from a 5K-follower account is a breakout. Always rank by the **weighted virality score**:

```
weighted_score = ln(views / followers) * ln(followers)
```

Only meaningful when `followers > 0` and `views/followers > 1`.

| Band | Meaning |
| --- | --- |
| ≥ 35 | Exceptional — a true breakout |
| 25–35 | Very strong |
| 18–25 | Strong |
| 10–18 | Promising |
| < 10 | Routine |

Sanity-check with:
- **Raw multiplier** `views / followers`: ≥ 20× notable, ≥ 100× exceptional.
- **Engagement rate** `(likes + comments + shares) / views`: > 5% = real resonance, < 1% = passive distribution (algorithm pushed it, people didn't engage).

## 2. Never compare raw views across platforms

Baseline medians differ by an order of magnitude:

| Platform | Median views | Notes |
| --- | --- | --- |
| TikTok | ~39K | 63% have transcripts |
| Instagram Reels | ~3.8K | no transcripts |
| YouTube Shorts | ~1K | 38% have transcripts |

So a 100K-view Reel is a far bigger deal than a 100K-view TikTok. When comparing across platforms, compare weighted scores or platform-relative multiples — never raw numbers.

## 3. Finding the winning formats

The highest-value output for a creator/marketer is the niche's **playbook**: what the winners do that the rest don't.

1. Take the **top quartile** of videos by weighted score, and the **bottom quartile**.
2. Bucket each on `hook_type` × `content_format` × `emotional_tone` (from Data Intelligence fields).
3. The buckets over-represented in the top quartile are the winning formats.
4. Quote real `hook_text` strings from top performers as copy-paste-able templates.

Requires `data_intelligence_enabled: true` at search time for the per-video AI fields.

## 4. Creator outliers

When surfacing rising creators (`/creators/outliers`), sort by **`weighted_score`**, not raw `outlier_ratio`. The weighted score balances how far a creator outperforms against how big their audience is, so you don't just surface tiny accounts with one lucky video. Use `order_by=rising` to rank by run-over-run velocity on a recurring agent.

## 5. Reading AI analysis (`analysis_data`)

- `themes[]` each carry a `confidence`. Weight `≥ 0.7` heavily; present `< 0.5` as tentative.
- Every theme has `evidence_video_ids[]` — **always join these back to the video list** so every claim you make is backed by a concrete example the user can watch.
- `top_10_breakdown` is the AI's curated standout list. Where it agrees with your weighted-score ranking, you've found the real winners — lead with those.

## 6. Trend lifecycle

Trend items carry a `status`:

| Status | What to tell the user |
| --- | --- |
| `new` | Highest opportunity — barely anyone is on this yet |
| `rising` | Act now — momentum is building |
| `steady` | Established — safe but crowded |
| `fading` | Avoid — past its peak |

On recurring Content Research Agents, follow a single trend across cycles via its `stable_key`.

## 7. Intelligence trust rules

- Only use per-video intelligence when `intelligence_status === "ready"`.
- Discount any fields listed in `low_confidence_fields[]`.
- `transcript_word_count: 0` **with** populated visual fields = deliberately silent content (text-on-screen / visual-only), not missing data.
- Never report `intelligence: null` or `analysis: null` as "no data" while `finalized: false` — those nulls just mean the secondary job hasn't finished yet.

## 8. Spend discipline (be a good steward of the user's balance)

- Reading is free; creating costs credits. Prefer re-reading existing Content Research Agents/runs over launching new ones.
- Satellite runs persist a `run_id` — re-read free forever via `GET /v1/satellite/runs/:run_id`. Store run_ids in memory.
- Recurring agents are free to create and only bill per scheduled run — set one up instead of re-running one-shot searches on the same niche.
- Don't enable `data_intelligence_enabled` (+$1.00) unless the user actually wants a content-format teardown.
- Surface `X-Balance-Remaining` proactively when it dips below $10.
