/**
 * routes/agents.ts — HTTP endpoint that lists the user's Virlo agents.
 *
 * Served at: /x/plugins/virlo/agents
 *
 * The virlo-results-viewer app calls this route to render a pickable list of
 * Content Research Agents, so the user can click one instead of pasting a UUID.
 * Listing agents is a free read.
 *
 * Credential resolution and the fetch/list helpers live in ../lib/virlo-api.
 */

import { getApiKey, virloFetch, extractList, errorResponse } from "../lib/virlo-api";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") || "50";

  try {
    const apiKey = await getApiKey();
    const raw = await virloFetch(`/agents?limit=${encodeURIComponent(limit)}`, apiKey);
    return Response.json({ agents: extractList(raw, "agents", "items") });
  } catch (err) {
    return errorResponse(err);
  }
}
