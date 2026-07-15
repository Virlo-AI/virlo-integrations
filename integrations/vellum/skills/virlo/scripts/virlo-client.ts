/**
 * virlo-client.ts - Shared helper for Virlo API scripts.
 *
 * Resolves the API key from the Vellum credential store at runtime via
 * `assistant credentials reveal`. No hardcoded keys, no env vars.
 *
 * Usage from other scripts:
 *   import { virloFetch, getApiKey, BASE_URL } from "./virlo-client.ts";
 */

import { execSync } from "node:child_process";

export const BASE_URL = "https://api.virlo.ai/v1";

/**
 * Resolve the Virlo API key from the credential store.
 * Throws if no credential is stored.
 */
export function getApiKey(): string {
  try {
    const key = execSync("assistant credentials reveal --service virlo --field api_key", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (!key) throw new Error("empty credential");
    return key;
  } catch {
    throw new Error(
      "No Virlo API key found in the credential store. " +
        "Store one with: assistant credentials set --service virlo --field api_key <your_key>\n" +
        "Get a key at https://dev.virlo.ai/dashboard",
    );
  }
}

/**
 * Make an authenticated request to the Virlo API.
 * Returns the parsed JSON response (unwraps the `data` envelope).
 */
export async function virloFetch(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
): Promise<unknown> {
  const apiKey = getApiKey();
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 402) {
    throw new Error(
      "Insufficient Virlo balance. Add funds at https://dev.virlo.ai/dashboard/billing",
    );
  }
  if (res.status === 401) {
    throw new Error(
      "Invalid Virlo API key. Check your credential store entry (must start with virlo_tkn_).",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Virlo API error ${res.status}: ${text}`);
  }

  const json = await res.json() as Record<string, unknown>;
  return json.data ?? json;
}

/**
 * Poll an agent until finalized: true.
 * Checks every `intervalMs` (default 60s), up to `maxWaitMs` (default 45 min).
 * Broad runs with meta_ads_enabled can take up to ~45 min, so keep the cap
 * generous — a slow run is not a failure.
 */
export async function pollUntilFinalized(
  agentId: string,
  intervalMs = 60_000,
  maxWaitMs = 45 * 60_000,
): Promise<Record<string, unknown>> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const agent = await virloFetch(`/agents/${agentId}`) as Record<string, unknown>;
    if (agent.finalized === true) {
      return agent;
    }
    console.error(`Agent ${agentId} status: ${agent.status} (waiting ${intervalMs / 1000}s)...`);
    await sleep(intervalMs);
  }
  throw new Error(`Agent ${agentId} did not finalize within ${maxWaitMs / 1000}s`);
}

/**
 * Poll a Satellite job until complete.
 * Checks every `intervalMs` (default 15s), up to `maxWaitMs` (default 5 min).
 */
export async function pollSatelliteJob(
  statusPath: string,
  intervalMs = 15_000,
  maxWaitMs = 5 * 60_000,
): Promise<Record<string, unknown>> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const job = await virloFetch(statusPath) as Record<string, unknown>;
    if (job.status === "completed" || job.status === "done") {
      return job;
    }
    if (job.status === "failed") {
      throw new Error(`Satellite job failed: ${JSON.stringify(job)}`);
    }
    console.error(`Satellite job status: ${job.status} (waiting ${intervalMs / 1000}s)...`);
    await sleep(intervalMs);
  }
  throw new Error(`Satellite job at ${statusPath} did not complete within ${maxWaitMs / 1000}s`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
