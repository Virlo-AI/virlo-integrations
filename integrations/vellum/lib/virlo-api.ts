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

/** Thrown when no Virlo API key is stored (or it resolves empty). Maps to 401. */
export class MissingApiKeyError extends Error {}

export async function getApiKey(): Promise<string> {
  let key: string;
  try {
    key = (await resolveCredential("virlo/api_key")).trim();
  } catch {
    key = "";
  }
  if (!key) {
    throw new MissingApiKeyError(
      "No Virlo API key is configured. Add one to load your Virlo data.",
    );
  }
  return key;
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

/** Map a thrown error to the HTTP status + machine-readable code a route returns. */
export function errorResponse(err: unknown): Response {
  const message = err instanceof Error ? err.message : "Unknown error";
  if (err instanceof MissingApiKeyError) {
    return Response.json(
      { error: message, code: "missing_api_key" },
      { status: 401 },
    );
  }
  // A 401 from Virlo means the stored key is present but rejected — same
  // remedy for the user (fix the key), so surface it as 401 too.
  if (message.includes("Invalid Virlo API key")) {
    return Response.json(
      { error: message, code: "invalid_api_key" },
      { status: 401 },
    );
  }
  if (message.includes("Insufficient")) {
    return Response.json(
      { error: message, code: "insufficient_balance" },
      { status: 402 },
    );
  }
  return Response.json({ error: message, code: "internal_error" }, { status: 500 });
}
