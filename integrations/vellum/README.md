# Virlo for Vellum

The official [Virlo](https://virlo.ai) plugin for [Vellum](https://www.vellum.ai/) assistants. Gives your always-on personal AI real-time short-form social intelligence: ask *"what's going viral in my niche right now, and why?"* and get back Virlo's weighted virality score, rising-creator outliers, winning content formats, and AI trend analysis across TikTok, YouTube Shorts, and Instagram Reels.

## What it does

Built on Virlo's forward-facing surfaces:

- **Content Research Agents** (`/v1/agents`) — the unified research engine. One resource, two modes:
  - *one-shot* (`is_recurring: false`) — niche search: *"what's viral in London TikTok fitness right now?"*
  - *recurring* (`is_recurring: true`) — monitoring: *"keep watching this niche and tell me weekly."*
- **Satellite** — creator, sound & video deep-dives: *"tell me about this creator / why did this video pop?"*
- **Trends** — regional (global/us/gb/au), momentum-ranked trend detection, including a free `emerging` feed for "what's about to take off."

> This plugin builds exclusively on Virlo's **Content Research Agents** (`/v1/agents`) — the unified, current research API.

## How it's built

This is a **thin skill layer over Virlo's existing hosted infrastructure** — it does not re-implement the API:

- [`SKILL.md`](SKILL.md) — the assistant "brain": how to use Virlo's primitives, handle async runs, and stay within budget.
- [`agent-playbook.md`](agent-playbook.md) — how to *interpret* results (weighted virality score, platform benchmarks, winning formats, trend lifecycle).
- [`manifest.json`](manifest.json) — plugin manifest: config schema, connection, onboarding, billing model.
- [`mcp.json`](mcp.json) — connects Vellum to Virlo's hosted MCP server (`dev.virlo.ai`), which already exposes the Content Research Agent, Satellite, and trends tools.
- [`marketplace.json`](marketplace.json) — the reference entry Vellum lists in their marketplace repo, pointing back here.
- [`prompts/`](prompts/) — golden prompts the plugin must handle well.
- [`examples/`](examples/) — worked end-to-end flows.

## Setup (for end users)

1. Create a Virlo account at [dev.virlo.ai/dashboard](https://dev.virlo.ai/dashboard).
2. Generate an API key (starts with `virlo_tkn_`).
3. Add a prepaid balance (minimum $10 — pay-as-you-go, no subscription, never expires) at [dev.virlo.ai/dashboard/billing](https://dev.virlo.ai/dashboard/billing).
4. Paste your key into the Virlo connection in Vellum.

## Billing model

**Bring-your-own-key. Tiering lives in Virlo.** Free vs. paid gating, credits, and rate limits are all enforced server-side by the Virlo API — the plugin never gates features, it just relays what the user's key is allowed to do. Users pay Virlo directly from their own prepaid balance.

- Reading results is **free**; creating research costs credits (1 credit = $0.01).
- One-shot agent: $0.50 · recurring agent: free to create, $0.50/run · Satellite: $0.50 · Data Intelligence add-on: +$1.00.
- The API returns `402` when a user is out of credits — the assistant surfaces this and links to billing.

## Async behavior

Content Research Agent runs (one-shot and recurring) take **~15–20 minutes** (up to 45 with Meta ads). The plugin polls until `finalized: true` or subscribes to the `content_research_agent.run.completed` webhook, then notifies the user — it never blocks them synchronously. This is a natural fit for Vellum's always-on model.

## Open items to confirm with Vellum

The files include inline `_notes` / `TODO(vellum)` markers where the exact host-specific schema needs confirmation:

- **Manifest & marketplace schema** — align wrapper keys with Vellum's actual plugin spec.
- **MCP transport suffix** — confirm `http` vs `sse` (`https://dev.virlo.ai/api/mcp/<transport>`).
- **Auth** — BYO `virlo_tkn_` key (current default) vs. Vellum-managed OAuth (Virlo's hosted MCP supports an OAuth key-mint flow).

## Links

- [Virlo API docs](https://dev.virlo.ai/docs)
- [Full API reference](https://dev.virlo.ai/llms-full.txt)
- [Agent playbook](https://dev.virlo.ai/agent-playbook.txt)
- [Dashboard](https://dev.virlo.ai/dashboard)

MIT © Virlo
