# Results Viewer

The plugin ships a pre-built app and route for browsing Virlo agent results interactively, instead of dumping raw JSON.

## Architecture

```
apps/results-viewer/
  src/
    index.html          # Minimal shell that loads the compiled bundle
    main.tsx            # React app (preact/compat) — all UI components
    styles.css          # Dark editorial styles
routes/results.ts       # HTTP route — proxies Virlo API, returns combined JSON
```

The app is TSX/React source under `src/` that compiles to `dist/` automatically on first open. The assistant does NOT build it — it ships with the plugin and is ready to use.

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

## The app — `apps/results-viewer/`

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

Dark editorial aesthetic. CSS custom properties for all colors, radii, and spacing. Fully responsive — single-column layout at 600px. Multi-file React app (preact/compat), no inline scripts (strict CSP).

## Integration workflow

1. Assistant runs a Content Research Agent (one-shot or recurring).
2. Agent finalizes (`finalized: true`).
3. Assistant loads `app-builder` skill and calls `app_open(app_id: "plugins~virlo~results-viewer")`.
4. The app opens in the workspace panel. User pastes the agent ID (or it auto-loads if passed as a query param).
5. The app fetches all results from the route and renders the interactive UI.

The assistant does NOT build, compile, or create the app. It ships with the plugin and compiles automatically on first open.
