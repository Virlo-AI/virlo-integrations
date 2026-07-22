/**
 * routes/results.ts — HTTP endpoint that fetches all Virlo agent results in one call.
 *
 * Served at: /x/plugins/virlo/results
 *
 * GET  /x/plugins/virlo/results?agent_id=<uuid>  — fetch all results for an agent
 * GET  /x/plugins/virlo/results?pending=1        — check for a pending agent ID (set by POST)
 * POST /x/plugins/virlo/results  { agent_id }    — stage an agent ID for auto-load in the app
 *
 * The results-viewer app calls this route to get videos, outliers, hashtags,
 * and sounds in a single JSON payload. All Virlo result endpoints are free
 * reads (no credit cost), so this route is safe to call repeatedly.
 *
 * The API key is resolved from the Vellum credential store at request time
 * via `assistant credentials reveal`, same as the plugin's scripts.
 */

import { execSync } from "node:child_process";

const BASE_URL = "https://api.virlo.ai/v1";

// In-memory staging area: the assistant POSTs an agent_id here before opening
// the app, so the app can auto-load results on mount without the user pasting anything.
let pendingAgentId: string | null = null;

function getApiKey(): string {
  try {
    const key = execSync(
      "assistant credentials reveal --service virlo --field api_key",
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    if (!key) throw new Error("empty credential");
    return key;
  } catch {
    throw new Error(
      "No Virlo API key found in the credential store. " +
        "Store one with: assistant credentials set --service virlo --field api_key <your_key>",
    );
  }
}

async function virloFetch(path: string, apiKey: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.status === 402) {
    throw new Error(
      "Insufficient Virlo balance. Add funds at https://dev.virlo.ai/dashboard/billing",
    );
  }
  if (res.status === 401) {
    throw new Error(
      "Invalid Virlo API key. Check the credential store entry (must start with virlo_tkn_).",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Virlo API error ${res.status}: ${text}`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  return json.data ?? json;
}

function extractList(data: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.data && Array.isArray(obj.data)) return obj.data;
    for (const k of keys) {
      if (obj[k] && Array.isArray(obj[k])) return obj[k] as unknown[];
    }
  }
  return [];
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const agentId = url.searchParams.get("agent_id");

  // Pending check: app calls this on mount to see if the assistant staged an agent_id
  if (!agentId) {
    if (url.searchParams.get("pending") === "1") {
      return Response.json({ agent_id: pendingAgentId });
    }
    return Response.json(
      { error: "Missing agent_id query parameter" },
      { status: 400 },
    );
  }

  try {
    const apiKey = getApiKey();

    const [agentMeta, videosRaw, outliersRaw, hashtagsRaw, soundsRaw] =
      await Promise.all([
        virloFetch(`/agents/${agentId}`, apiKey),
        virloFetch(
          `/agents/${agentId}/videos?order_by=views&sort=desc&limit=50`,
          apiKey,
        ),
        virloFetch(
          `/agents/${agentId}/creators/outliers?order_by=weighted_score&limit=20`,
          apiKey,
        ),
        virloFetch(`/agents/${agentId}/hashtags?limit=50`, apiKey),
        virloFetch(`/agents/${agentId}/sounds?sort=rising&limit=30`, apiKey),
      ]);

    return Response.json({
      agent: agentMeta,
      videos: extractList(videosRaw, "videos", "items"),
      outliers: extractList(outliersRaw, "outliers", "items"),
      hashtags: extractList(hashtagsRaw, "hashtags", "items"),
      sounds: extractList(soundsRaw, "sounds", "items"),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("No Virlo API key")
      ? 401
      : message.includes("Insufficient")
        ? 402
        : 500;
    return Response.json({ error: message }, { status });
  }
}

/**
 * POST /x/plugins/virlo/results
 * Body: { "agent_id": "<uuid>" }
 *
 * Stages an agent ID so the results-viewer app can auto-load on mount.
 * The assistant calls this right before opening the app, eliminating the
 * need for the user to paste an ID manually.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { agent_id?: string };
    const id = body?.agent_id;
    if (!id || typeof id !== "string") {
      return Response.json(
        { error: "Missing agent_id in request body" },
        { status: 400 },
      );
    }
    pendingAgentId = id;
    return Response.json({ ok: true, agent_id: id });
  } catch {
    return Response.json(
      { error: "Invalid JSON body — expected { \"agent_id\": \"<uuid>\" }" },
      { status: 400 },
    );
  }
}
