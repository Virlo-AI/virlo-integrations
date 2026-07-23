/**
 * lib/virlo-api.ts — shared helpers for the plugin's HTTP routes.
 *
 * Lives outside routes/ so it is not served as an endpoint; the route files
 * import from it. Keeps credential resolution, the authenticated fetch wrapper,
 * list extraction, and error→status mapping in one place.
 *
 * The API key is resolved from the Vellum credential store at request time via
 * the plugin API's async `resolveCredential` — never a blocking `execSync`,
 * which would stall the assistant's event loop while the shell-out runs.
 */

import { resolveCredential } from "@vellumai/plugin-api";

export const BASE_URL = "https://api.virlo.ai/v1";

export async function getApiKey(): Promise<string> {
  try {
    const key = (await resolveCredential("virlo/api_key")).trim();
    if (!key) throw new Error("empty credential");
    return key;
  } catch {
    throw new Error(
      "No Virlo API key found in the credential store. " +
        "Store one with: assistant credentials set --service virlo --field api_key <your_key>",
    );
  }
}

export async function virloFetch(path: string, apiKey: string): Promise<unknown> {
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

export function extractList(data: unknown, ...keys: string[]): unknown[] {
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

/** Map a thrown error message to the HTTP status a route should return. */
export function errorResponse(err: unknown): Response {
  const message = err instanceof Error ? err.message : "Unknown error";
  const status = message.includes("No Virlo API key")
    ? 401
    : message.includes("Insufficient")
      ? 402
      : 500;
  return Response.json({ error: message }, { status });
}
