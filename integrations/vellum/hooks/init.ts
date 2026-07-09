/**
 * init hook - fires once when the plugin is registered (on boot or install).
 *
 * The Virlo plugin is a thin skill layer: the SKILL.md teaches the assistant
 * how to call Virlo's REST API, and the scripts under skills/virlo/scripts/
 * resolve the API key from the credential store at runtime via
 * `assistant credentials reveal --service virlo --field api_key`.
 *
 * This hook does not touch config or process environment. It only logs that
 * the plugin is loaded so daemon logs confirm successful registration.
 */

import type { InitContext } from "@vellumai/plugin-api";

export default async function init(ctx: InitContext): Promise<void> {
  ctx.logger.info("Virlo plugin loaded - short-form social intelligence skill active");
}
