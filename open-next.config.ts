import { defineCloudflareConfig } from "@opennextjs/cloudflare";
// import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

/*
  OpenNext — the adapter that turns `next build` output into a Cloudflare Worker.

  Nothing is overridden here yet. The one override worth adding is the incremental cache, which
  needs an R2 bucket to exist first; wrangler.jsonc carries the two commented blocks and the
  reason it matters for reviews.
*/
export default defineCloudflareConfig({
  // incrementalCache: r2IncrementalCache,
});
