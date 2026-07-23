import type { AgentSummary, ResultsData } from "../types";

/**
 * Thrown when the route reports that no usable Virlo API key is configured
 * (HTTP 401). The app catches this to show the "add your API key" screen
 * rather than a generic error.
 */
export class ApiKeyRequiredError extends Error {}

/** Build the right Error for a failed response: ApiKeyRequiredError on 401. */
async function toError(res: Response): Promise<Error> {
  const message = await readError(res);
  return res.status === 401 ? new ApiKeyRequiredError(message) : new Error(message);
}

/**
 * Pull a human-readable message out of an error response, whatever shape it
 * takes. Route errors are `{ error: "..." }`, but a platform 404 (or other
 * non-route failure) can return `{ error: { message } }`, `{ message }`, a
 * bare string, or non-JSON — so we never stringify an object into the
 * useless "[object Object]".
 */
async function readError(res: Response): Promise<string> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => "");
  }
  const msg = messageFrom(body);
  return msg || `Request failed (HTTP ${res.status})`;
}

function messageFrom(body: unknown): string {
  if (typeof body === "string") return body.trim();
  if (!body || typeof body !== "object") return "";
  const obj = body as Record<string, unknown>;
  const candidate = obj.error ?? obj.message;
  if (typeof candidate === "string") return candidate.trim();
  if (candidate && typeof candidate === "object") {
    const inner = (candidate as Record<string, unknown>).message;
    if (typeof inner === "string") return inner.trim();
  }
  return "";
}

/**
 * List the user's Virlo agents via the plugin route, so the picker can show
 * them as clickable cards. Listing agents is a free read.
 */
export async function fetchAgents(): Promise<AgentSummary[]> {
  const res = await window.vellum.fetch("/x/plugins/virlo/agents");
  if (!res.ok) throw await toError(res);
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
  if (!res.ok) throw await toError(res);
  return (await res.json()) as ResultsData;
}
