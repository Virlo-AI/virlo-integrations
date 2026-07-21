# Results Viewer (render-results.ts)

The `render-results.ts` script generates a standalone, self-contained HTML file from any finalized Virlo Content Research Agent. It's the standard way to present results visually instead of dumping raw JSON.

## Quick start

```bash
# After an agent finalizes:
bun {baseDir}/scripts/render-results.ts --agent-id <uuid>

# With options:
bun {baseDir}/scripts/render-results.ts --agent-id <uuid> --output ~/results.html --title "Fitness TikTok Research"
```

## What it does

1. Fetches all result endpoints in parallel (all free reads — no credit cost):
   - `GET /v1/agents/:id` — agent metadata (keywords, intent, created date)
   - `GET /v1/agents/:id/videos?order_by=views&sort=desc&limit=50` — top 50 videos
   - `GET /v1/agents/:id/creators/outliers?order_by=weighted_score&limit=20` — top 20 outlier creators
   - `GET /v1/agents/:id/hashtags?limit=50` — top 50 hashtags by views
   - `GET /v1/agents/:id/sounds?sort=rising&limit=30` — top 30 rising sounds

2. Generates a single HTML file with all CSS/JS inline (no CDN, no external deps).

3. Writes the file to disk. Prints the path to stdout (for piping), logs a human-readable summary to stderr.

## CLI flags

| Flag | Required | Description |
|------|----------|-------------|
| `--agent-id <uuid>` | Yes | The finalized agent ID |
| `--output <path>` | No | Output file path. Defaults to `virlo-results-<first8>.html` in cwd |
| `--title <string>` | No | HTML page title + header. Defaults to "Virlo Research — <first 3 keywords>" |

## The UI

Dark editorial aesthetic matching Vellum's design language. Four tabs:

### Top Videos
- Card grid, auto-filling `minmax(300px, 1fr)` columns
- Each card: thumbnail (16:10), platform badge, rank badge, description (3-line clamp), creator with avatar + follower count, stats (views/likes/shares/bookmarks), format tags from Virlo's AI intelligence layer
- Every card is a clickable `<a>` linking to the original video URL
- Stats bar: total videos, top views, TikTok count, Instagram count

### Creator Outliers
- Card grid, `minmax(360px, 1fr)` columns
- Each card: avatar, handle, follower count, posts/week, 4-stat grid (avg views, top video, outlier ratio, breakout count), content angle quote box, topic tags (matching topics highlighted in accent green)
- Every card links to the creator's profile URL

### Hashtags
- Vertical list with bar chart visualization
- Each row: hashtag name (accent green), proportional bar fill, view count
- Sorted by total views descending

### Rising Sounds
- Card grid, `minmax(250px, 1fr)` columns
- Each card: music note icon, sound name, platform tag

## Output format

The HTML file is completely self-contained:
- All CSS is inline in a `<style>` tag
- All JS is inline in a `<script>` tag (just tab switching)
- Image URLs (thumbnails, avatars) point to Virlo's CDN (`auth.virlo.ai/storage/...`)
- No fonts loaded — uses system font stack (`-apple-system, DM Sans, system-ui`)
- Works offline once loaded (images need network)

## Design tokens

The viewer uses CSS custom properties for theming:
- `--bg: #0a0a0b` — page background
- `--surface: #141416` — card background
- `--accent: #34d399` — emerald green (Vellum brand-adjacent)
- `--text: #e4e4e7` — primary text
- Fully responsive: collapses to single-column on mobile (≤600px)

## Integration with the assistant workflow

The SKILL.md instructs the assistant to run this script after any agent finalizes. The typical flow:

1. Create agent → poll until finalized (~15-20 min)
2. Run `render-results.ts --agent-id <uuid>`
3. Open the HTML file for the user (or share the path)
4. Provide a written summary of key findings alongside the viewer

The viewer is the browseable detail; the assistant's summary is the interpretation layer on top.
