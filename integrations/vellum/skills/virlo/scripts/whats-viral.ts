#!/usr/bin/env bun
/**
 * whats-viral.ts - One-shot Content Research Agent flow.
 *
 * Kicks off a niche search, polls until finalized, then reads and prints
 * the results (analysis, trends, videos, outlier creators).
 *
 * Usage:
 *   bun whats-viral.ts --intent "viral fitness content on TikTok in London" \
 *     --keywords "london gym,calisthenics london,uk fitness" --platforms tiktok
 *
 * Cost: $0.50 (agent) + optional $1.00 (data-intelligence add-on)
 */

import { virloFetch, pollUntilFinalized } from "./virlo-client.ts";

interface Args {
  intent: string;
  keywords: string[];
  platforms?: string[];
  dataIntelligence?: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const intent = get("--intent");
  const keywordsRaw = get("--keywords");
  if (!intent || !keywordsRaw) {
    console.error("Usage: bun whats-viral.ts --intent \"...\" --keywords \"a,b,c\" [--platforms tiktok] [--data-intelligence]");
    process.exit(1);
  }

  return {
    intent,
    keywords: keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean),
    platforms: get("--platforms")?.split(",").map((p) => p.trim()),
    dataIntelligence: args.includes("--data-intelligence"),
  };
}

async function main() {
  const { intent, keywords, platforms, dataIntelligence } = parseArgs();

  console.error(`Creating one-shot Content Research Agent...`);
  console.error(`  intent: ${intent}`);
  console.error(`  keywords: ${keywords.join(", ")}`);
  console.error(`  platforms: ${platforms?.join(", ") ?? "all"}`);
  console.error(`  data_intelligence: ${dataIntelligence ?? false}`);

  const agent = await virloFetch("/agents", {
    method: "POST",
    body: {
      is_recurring: false,
      intent,
      keywords,
      platforms: platforms ?? ["tiktok", "youtube", "instagram"],
      data_intelligence_enabled: dataIntelligence ?? false,
    },
  }) as Record<string, unknown>;

  const agentId = agent.id as string;
  console.error(`Agent created: ${agentId}`);
  console.error("Polling until finalized (typically 15-20 min)...");

  await pollUntilFinalized(agentId);
  console.error("Agent finalized! Reading results...\n");

  // Read results (all free)
  const [analysis, trends, videos, outliers] = await Promise.all([
    virloFetch(`/agents/${agentId}/analysis/latest`),
    virloFetch(`/agents/${agentId}/trends/latest`),
    virloFetch(`/agents/${agentId}/videos?order_by=views&sort=desc&limit=25`),
    virloFetch(`/agents/${agentId}/creators/outliers?order_by=weighted_score&limit=10`),
  ]);

  console.log("=== AI Analysis ===");
  console.log(JSON.stringify(analysis, null, 2));

  console.log("\n=== Trends ===");
  console.log(JSON.stringify(trends, null, 2));

  console.log("\n=== Top Videos (re-rank by weighted score, not raw views) ===");
  console.log(JSON.stringify(videos, null, 2));

  console.log("\n=== Outlier Creators ===");
  console.log(JSON.stringify(outliers, null, 2));
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
