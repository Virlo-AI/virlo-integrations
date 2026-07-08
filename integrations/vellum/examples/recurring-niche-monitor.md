# Example — Keep watching a niche (recurring Content Research Agent)

For "keep an eye on X and tell me what changes." A great fit for Vellum's always-on assistant: create once, get notified every cycle. This is a Content Research Agent with `is_recurring: true` — the same resource as a one-shot search, just scheduled.

## User prompt

> "Keep watching what's trending in London TikTok fitness and tell me each week."

## Agent steps

### 1. Create a recurring agent (free to create, $0.50 per run)

```bash
curl -X POST "https://api.virlo.ai/v1/agents" \
  -H "Authorization: Bearer {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "is_recurring": true,
    "intent": "track viral fitness content among London TikTok creators",
    "keywords": ["london gym", "calisthenics london", "uk fitness transformation", "london personal trainer"],
    "platforms": ["tiktok"],
    "cadence": "weekly"
  }'
```

Tell the user it's set up and will report weekly.

### 2. Subscribe to the completion webhook

Register `content_research_agent.run.completed` (via the `/v1/webhooks…` management endpoints). Each cycle fires the event with `is_recurring: true` and a `run_id`. When it lands, fetch the run and notify the user proactively.

### 3. Each cycle — surface what changed

```bash
# New trends this cycle (follow across cycles via stable_key)
curl "https://api.virlo.ai/v1/agents/{id}/trends/latest" -H "Authorization: Bearer {api_key}"

# Rising creators by run-over-run velocity
curl "https://api.virlo.ai/v1/agents/{id}/creators/outliers?order_by=rising&limit=10" -H "Authorization: Bearer {api_key}"

# Rising sounds
curl "https://api.virlo.ai/v1/agents/{id}/sounds?sort=rising&limit=10" -H "Authorization: Bearer {api_key}"
```

Frame the weekly update as a diff: what's `new`/`rising` vs last week, which creators accelerated, which sounds are breaking out.

## Notes

- Recurring agents **self-optimize** their keywords over time — no babysitting.
- Use `stable_key` on trend items to track a single trend's lifecycle across weeks.

## Total cost

Free to create; **$0.50 per weekly run**. All reads free.
