# Results Viewer

The plugin ships a pre-built app and route for browsing Virlo agent results interactively, instead of dumping raw JSON.

## Architecture

```
apps/results-viewer/index.html   (single-file app — UI rendered in workspace panel)
routes/results.ts                (HTTP route — proxies Virlo API, returns combined JSON)
```

The app is a single-file HTML app (inline CSS/JS allowed under the plugin CSP). It fetches data from the plugin's route, which resolves the Virlo API key from the credential store and calls all four result endpoints in parallel.

## The route — `routes/results.ts`

Served at: `GET /x/plugins/virlo/results?agent_id=<uuid>`

Calls these Virlo endpoints in one parallel batch (all free reads):

| Endpoint | Data |
| --- | --- |
| `GET /v1/agents/:id` | Agent metadata (keywords, intent, created_at) |
| `GET /v1/agents/:id/videos?order_by=views&sort=desc&limit=50` | Top 50 videos by views |
| `GET /v1/agents/:id/creators/outliers?order_by=weighted_score&limit=20` | Top 20 creator outliers |
| `GET /v1/agents/:id/hashtags?limit=50` | Top 50 hashtags |
| `GET /v1/agents/:id/sounds?sort=rising&limit=30` | Top 30 rising sounds |

Returns a single JSON payload:

```json
{
  "agent": { ... },
  "videos": [ ... ],
  "outliers": [ ... ],
  "hashtags": [ ... ],
  "sounds": [ ... ]
}
```

Error responses:
- `400` — missing `agent_id` query parameter
- `401` — no Virlo API key in credential store, or invalid key
- `402` — insufficient Virlo balance
- `500` — Virlo API error or other failure

## The app — `apps/results-viewer/index.html`

App ID: `plugins~virlo~results-viewer`

### How it works

1. On load, checks `window.location.search` for an `agent_id` query parameter. If present, auto-fetches results.
2. If no `agent_id` in the URL, shows an input screen where the user can paste an agent UUID and click "Load Results" (or press Enter).
3. Fetches `GET /x/plugins/virlo/results?agent_id=<uuid>` and renders the response.

### UI — four tabs

1. **Top Videos** — responsive card grid. Each card shows thumbnail, platform badge, rank, description (truncated), creator handle + follower count, view/like/share/bookmark stats, and Virlo's AI-classified format/topic tags. Every card links to the original video.
2. **Creator Outliers** — cards for rising small creators. Shows avatar, handle, platform, follower count, posting frequency, four stat tiles (avg views, top video, outlier ratio, breakout count), content angle, and topic tags (matching topics highlighted). Every card links to the creator's profile.
3. **Hashtags** — ranked list with animated bar chart visualization. Each row shows the hashtag, a proportional bar, and total views.
4. **Rising Sounds** — grid of trending audio tracks with platform label.

### Design

Dark editorial aesthetic. CSS custom properties for all colors, radii, and spacing. Fully responsive — single-column layout at 600px. No external dependencies, no CDN imports, no build step.

## Integration workflow

1. Assistant runs a Content Research Agent (one-shot or recurring).
2. Agent finalizes (`finalized: true`).
3. Assistant opens the results-viewer app: `plugins~virlo~results-viewer`.
4. If query params are supported, pass `agent_id=<uuid>` for auto-load. Otherwise the user enters the agent ID manually.
5. The app fetches all results from the route and renders the interactive UI.

## Adding the app to the plugin

The app and route are part of the plugin's source tree. They arrive on install, update on upgrade, and are removed on uninstall — no manual setup needed. The route resolves the API key from the credential store at request time, same as the plugin's scripts.
