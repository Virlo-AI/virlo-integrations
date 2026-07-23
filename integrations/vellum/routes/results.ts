/**
 * routes/results.ts — HTTP endpoint that fetches all Virlo agent results in one call.
 *
 * Served at: /x/plugins/virlo/results?agent_id=<uuid>
 *
 * The virlo-results-viewer app calls this route to get videos, outliers, hashtags,
 * and sounds in a single JSON payload. All Virlo result endpoints are free
 * reads (no credit cost), so this route is safe to call repeatedly.
 *
 * Credential resolution and the fetch/list helpers live in ../lib/virlo-api.
 */

import { getApiKey, virloFetch, extractList, errorResponse } from "../lib/virlo-api";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const agentId = url.searchParams.get("agent_id");

  if (!agentId) {
    return Response.json(
      { error: "Missing agent_id query parameter" },
      { status: 400 },
    );
  }

  try {
    const apiKey = await getApiKey();

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
    return errorResponse(err);
  }
}
