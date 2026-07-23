import type { AgentSummary, ResultsData } from "../types";

/**
 * List the user's Virlo agents via the plugin route, so the picker can show
 * them as clickable cards. Listing agents is a free read.
 */
export async function fetchAgents(): Promise<AgentSummary[]> {
  const res = await window.vellum.fetch("/x/plugins/virlo/agents");
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "HTTP " + res.status);
  }
  const data = (await res.json()) as { agents?: AgentSummary[] };
  return data.agents || [];
}

/**
 * Fetch all agent results from the plugin route. The route resolves the Virlo
 * API key from the credential store and aggregates every result endpoint into
 * a single JSON payload — so the app never touches the Virlo API directly.
 */
export async function fetchResults(agentId: string): Promise<ResultsData> {
  const res = await window.vellum.fetch(
    "/x/plugins/virlo/results?agent_id=" + encodeURIComponent(agentId),
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "HTTP " + res.status);
  }
  return (await res.json()) as ResultsData;
}
