# Virlo Integrations

Official Virlo plugins, skills, and connectors for AI assistant platforms and agent frameworks.

Virlo is a short-form social intelligence platform. It scrapes TikTok, YouTube Shorts, Instagram Reels, and Meta Ads, runs AI analysis over the results, and exposes it all through the [Virlo Public API](https://api.virlo.ai/v1) and a hosted [MCP server](https://dev.virlo.ai). This repo packages that capability into drop-in integrations for third-party assistant ecosystems.

Each integration lets an assistant answer questions like *"what's going viral in my niche right now, and why?"* and get back Virlo's weighted virality score, rising-creator outliers, winning formats, and AI trend analysis.

## Design principles

Every integration in this repo follows the same rules, so partners can ship one version and never have to think about our business logic:

- **Tiering lives in Virlo, not the plugin.** Free vs. paid gating, credits, and rate limits are all enforced server-side by the Virlo API. The plugin is a thin, dumb client — it just calls the API and renders results.
- **Bring-your-own credentials.** Users create a Virlo account and connect their own Virlo API key (or OAuth). No shared keys, no proxying.
- **One contract, many hosts.** The tool names, schemas, and skill prose are a public contract. We version them here and keep them in sync with the [hosted MCP server](https://dev.virlo.ai).
- **Async-first.** Deep research (Content Research Agent runs) takes ~15–20 minutes. Integrations poll on `finalized: true` or subscribe to `*.run.completed` webhooks rather than blocking.

## Integrations

| Integration | Host platform | Status | Path |
| --- | --- | --- | --- |
| **Vellum Assistant** | [Vellum](https://www.vellum.ai/) personal AI | MVP | [`integrations/vellum/`](integrations/vellum/) |

More partner integrations will be added as sibling folders under `integrations/`.

## Repo layout

```
virlo-integrations/
├── README.md                 ← you are here
├── LICENSE                   ← MIT
└── integrations/
    └── vellum/               ← Vellum assistant plugin
        ├── README.md         ← install + setup for this integration
        ├── SKILL.md          ← the assistant "brain" (how to use Virlo well)
        ├── agent-playbook.md ← how to interpret Virlo results
        ├── manifest.json     ← plugin manifest (config schema, entry points)
        ├── marketplace.json  ← the reference entry Vellum lists in their marketplace repo
        ├── mcp.json          ← MCP server connection config
        ├── prompts/          ← golden prompts the plugin must handle well
        └── examples/         ← worked end-to-end flows
```

## Contributing a new integration

1. Copy `integrations/vellum/` to `integrations/<platform>/`.
2. Keep the Virlo API/MCP contract identical — only adapt the host-specific manifest and auth wiring.
3. Update the table above and open a PR.

## Links

- [Virlo API docs](https://dev.virlo.ai/docs)
- [Full API reference](https://dev.virlo.ai/llms-full.txt)
- [Agent playbook](https://dev.virlo.ai/agent-playbook.txt)
- [Dashboard & API keys](https://dev.virlo.ai/dashboard)

## License

MIT © Virlo
