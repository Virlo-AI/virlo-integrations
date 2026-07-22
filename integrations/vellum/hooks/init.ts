/**
 * init hook - fires once when the plugin is registered (on boot or install).
 *
 * The Virlo plugin ships a pre-built results-viewer app alongside its skill
 * and route. The app is automatically discovered by the host when the plugin
 * is installed — no registration step needed. This hook logs the app ID so
 * daemon logs confirm the app surface is available.
 */

import type { InitContext } from "@vellumai/plugin-api";

export default async function init(ctx: InitContext): Promise<void> {
  ctx.logger.info("Virlo plugin loaded - short-form social intelligence skill active");
  ctx.logger.info("Virlo results-viewer app available - open with app_id: plugins~virlo~results-viewer");
  ctx.logger.info("Virlo results route available at /x/plugins/virlo/results");
}
