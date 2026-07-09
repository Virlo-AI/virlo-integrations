#!/usr/bin/env bun
/**
 * recurring-monitor.ts - Create a recurring Content Research Agent.
 *
 * Sets up a monitor that re-runs on a cadence and self-optimizes.
 * After creation, the assistant subscribes to the completion webhook
 * and notifies the user each cycle.
 *
 * Usage:
 *   bun recurring-monitor.ts --intent "track viral fitness in London TikTok" \
 *     --keywords "london gym,calisthenics london" --platforms tiktok --cadence weekly
 *
 * Cost: Free to create, $0.50 per run.
 */

import { virloFetch } from "./virlo-client.ts";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const intent = get("--intent");
  const keywordsRaw = get("--keywords");
  const cadence = get("--cadence") ?? "weekly";
  if (!intent || !keywordsRaw) {
    console.error('Usage: bun recurring-monitor.ts --intent "..." --keywords "a,b,c" [--cadence weekly] [--platforms tiktok]');
    process.exit(1);
  }

  return {
    intent,
    keywords: keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean),
    cadence: cadence as "daily" | "weekly" | "monthly",
    platforms: get("--platforms")?.split(",").map((p) => p.trim()),
  };
}

async function main() {
  const { intent, keywords, cadence, platforms } = parseArgs();

  console.error(`Creating recurring Content Research Agent (cadence: ${cadence})...`);
  console.error(`  intent: ${intent}`);
  console.error(`  keywords: ${keywords.join(", ")}`);

  const agent = await virloFetch("/agents", {
    method: "POST",
    body: {
      is_recurring: true,
      intent,
      keywords,
      platforms: platforms ?? ["tiktok", "youtube", "instagram"],
      cadence,
    },
  }) as Record<string, unknown>;

  console.log("Recurring agent created:");
  console.log(JSON.stringify(agent, null, 2));
  console.error("\nSubscribe to the 'content_research_agent.run.completed' webhook to get notified each cycle.");
  console.error("Each run costs $0.50. All result reads are free.");
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
