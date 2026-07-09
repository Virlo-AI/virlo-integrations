# Virlo for Vellum

The official [Virlo](https://virlo.ai) plugin for [Vellum](https://www.vellum.ai/) assistants. Gives your always-on personal AI real-time short-form social intelligence: ask *"what's going viral in my niche right now, and why?"* and get back Virlo's weighted virality score, rising-creator outliers, winning content formats, and AI trend analysis across TikTok, YouTube Shorts, and Instagram Reels.

## What it does

Built on Virlo's forward-facing surfaces:

- **Content Research Agents** (`/v1/agents`) - the unified research engine. One resource, two modes:
  - *one-shot* (`is_recurring: false`) - niche search: *"what's viral in London TikTok fitness right now?"*
  - *recurring* (`is_recurring: true`) - monitoring: *"keep watching this niche and tell me weekly."*
- **Satellite** - creator, sound & video deep-dives: *"tell me about this creator / why did this video pop?"*
- **Trends** - regional (global/us/gb/au), momentum-ranked trend detection, including a free `emerging` feed for "what's about to take off."

## Plugin structure

```
integrations/vellum/
  package.json              Plugin manifest (name, version, peerDependencies)
  mcp.json                  MCP server connection config (for future MCP support)
  hooks/
    init.ts                 Logs plugin registration (no config/env state)
    shutdown.ts             No-op (no state to clean up)
  skills/
    virlo/
      SKILL.md              The assistant skill: how to use Virlo's API
      scripts/              Runnable TypeScript scripts for each flow
        virlo-client.ts     Shared helper (credential resolution, fetch, polling)
        whats-viral.ts      One-shot niche search flow
        recurring-monitor.ts  Recurring monitor creation
        creator-deep-dive.ts  Satellite creator lookup + video outlier
      references/           Worked flow documentation + golden prompts
        agent-playbook.md   How to interpret results (weighted score, formats)
        golden-prompts.md   Acceptance criteria for QA
        whats-viral-in-my-niche.md
        recurring-niche-monitor.md
        creator-deep-dive.md
```

## How it works

1. The **init hook** logs that the plugin is loaded. No config or env state.
2. The **SKILL.md** teaches the assistant how to call Virlo's REST API, resolving the API key from the credential store at runtime.
3. The **scripts** handle credential resolution, API calls, and async polling automatically via `bun run`.
4. For ad-hoc calls, the assistant uses its `bash` tool with `assistant credentials reveal --service virlo --field api_key`.

## Setup (for end users)

1. Create a Virlo account at [dev.virlo.ai/dashboard](https://dev.virlo.ai/dashboard).
2. Generate an API key (starts with `virlo_tkn_`).
3. Add a prepaid balance (minimum $10 - pay-as-you-go, no subscription, never expires) at [dev.virlo.ai/dashboard/billing](https://dev.virlo.ai/dashboard/billing).
4. Store the API key in the Vellum credential store:
   ```bash
   assistant credentials set --service virlo --field api_key "virlo_tkn_<your_key>"
   ```

## Billing model

**Bring-your-own-key. Tiering lives in Virlo.** Free vs. paid gating, credits, and rate limits are all enforced server-side by the Virlo API - the plugin never gates features, it just relays what the user's key is allowed to do. Users pay Virlo directly from their own prepaid balance.

- Reading results is **free**; creating research costs credits (1 credit = $0.01).
- One-shot agent: $0.50, recurring agent: free to create + $0.50/run, Satellite: $0.50, Data Intelligence add-on: +$1.00.
- The API returns `402` when a user is out of credits - the assistant surfaces this and links to billing.

## Async behavior

Content Research Agent runs (one-shot and recurring) take **~15-20 minutes** (up to 45 with Meta ads). The scripts poll until `finalized: true`, or the assistant can subscribe to the `content_research_agent.run.completed` webhook, then notify the user - it never blocks them synchronously. This is a natural fit for Vellum's always-on model.

## Links

- [Virlo API docs](https://dev.virlo.ai/docs)
- [Full API reference](https://dev.virlo.ai/llms-full.txt)
- [Agent playbook](https://dev.virlo.ai/agent-playbook.txt)
- [Dashboard](https://dev.virlo.ai/dashboard)

MIT (c) Virlo
