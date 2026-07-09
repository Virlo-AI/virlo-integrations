#!/usr/bin/env bun
/**
 * creator-deep-dive.ts - Satellite creator lookup flow.
 *
 * Looks up a creator, polls until the job completes, then prints stats,
 * outlier videos, and cross-platform links. Optionally analyzes a
 * standout video.
 *
 * Usage:
 *   bun creator-deep-dive.ts --platform tiktok --username londonfitguy
 *   bun creator-deep-dive.ts --platform tiktok --username londonfitguy --video-url "https://tiktok.com/..."
 *
 * Cost: $0.50 (creator lookup) + optional $0.50 (video outlier analysis)
 */

import { virloFetch, pollSatelliteJob } from "./virlo-client.ts";

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const platform = get("--platform");
  const username = get("--username");
  if (!platform || !username) {
    console.error("Usage: bun creator-deep-dive.ts --platform tiktok --username <handle> [--video-url \"https://...\"]");
    process.exit(1);
  }

  return {
    platform,
    username,
    videoUrl: get("--video-url"),
  };
}

async function main() {
  const { platform, username, videoUrl } = parseArgs();

  // 1. Look up the creator ($0.50)
  console.error(`Looking up @${username} on ${platform}...`);
  const lookup = await virloFetch(
    `/satellite/creator/${platform}/${username}?include=videos,outliers&cross_links=true&max_videos=50`,
  ) as Record<string, unknown>;

  const jobId = lookup.job_id as string;
  if (!jobId) {
    // Some responses return data directly
    console.log("Creator data:");
    console.log(JSON.stringify(lookup, null, 2));
    return;
  }

  console.error(`Job created: ${jobId}. Polling (typically 20-60s)...`);
  const result = await pollSatelliteJob(`/satellite/creator/status/${jobId}`);

  console.log("=== Creator Stats ===");
  console.log(JSON.stringify(result, null, 2));

  // Save run_id for free re-reads
  const runId = (result as Record<string, unknown>).run_id as string | undefined;
  if (runId) {
    console.error(`\nRun ID: ${runId} (re-read free forever via GET /v1/satellite/runs/${runId})`);
  }

  // 2. Optional: analyze a standout video ($0.50)
  if (videoUrl) {
    console.error(`\nAnalyzing video outlier: ${videoUrl}...`);
    const outlierJob = await virloFetch("/satellite/video-outlier", {
      method: "POST",
      body: { url: videoUrl, platform },
    }) as Record<string, unknown>;

    const outlierJobId = outlierJob.job_id as string;
    if (outlierJobId) {
      console.error(`Outlier job: ${outlierJobId}. Polling...`);
      const outlierResult = await pollSatelliteJob(`/satellite/video-outlier/status/${outlierJobId}`);
      console.log("\n=== Video Outlier Analysis ===");
      console.log(JSON.stringify(outlierResult, null, 2));
    }
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
