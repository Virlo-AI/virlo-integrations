/**
 * shutdown hook - fires when the plugin is torn down (process exit,
 * uninstall, disable, or hot-reload). No state to clean up since the
 * init hook does not set environment variables or write state files.
 */

import type { ShutdownContext } from "@vellumai/plugin-api";

export default async function shutdown(_ctx: ShutdownContext): Promise<void> {
  // No-op. Credential resolution happens per-script-invocation, not at init.
}
