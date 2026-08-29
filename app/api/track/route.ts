import { getProduct, search } from "@/lib/catalog";
import { isAdmin } from "@/lib/admin";
import { recordProductView, recordSearch, recordSurfaceView } from "@/lib/analytics";

/*
  The counters' only write path — the third route handler on the site.

  It exists because the surfaces worth counting are the ones that must not become dynamic.
  `/p/[slug]` is 470 prerendered pages; a server-side insert there would either break the
  prerender or, cached, never run again. So the browser reports the view and this handler is the
  only thing that writes. Bots largely do not run JavaScript, which excludes crawlers for free.

  It answers 204 to everything, always. A beacon has nothing useful to do with a failure, and a
  different response for a rejected key would let somebody map which slugs exist by probing.

  CSRF needs no token here, which is worth stating rather than leaving as an apparent omission: a
  forged request can only inflate an anonymous counter, and there is no per-visitor state behind
  it to confuse. What every key does need is validation, because the body is a stranger's input.
*/

/** Fixed set, so `page_views` can never be widened by a caller inventing names. */
const SURFACES = new Set([
  "home",
  "search",
  "category",
  "deals",
  "starters",
  "guides",
  "equipment",
]);

const noContent = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return noContent();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noContent();
  }

  const { kind, key } = (body ?? {}) as { kind?: unknown; key?: unknown };
  if (typeof kind !== "string" || typeof key !== "string") return noContent();

  try {
    // Whoever reads the dashboard must not move the figures on it. Two people opening every product
    // page while building the thing is a large fraction of a small shop's traffic, and it is the one
    // fraction that is definitely not a customer.
    //
    // Cheap for a stranger: readSession() returns null without a query when there is no session
    // cookie, so anonymous traffic — nearly all of it — costs nothing extra here. Only a signed-in
    // request pays the session and email lookups.
    if (await isAdmin()) return noContent();

    if (kind === "product") {
      // Resolved through the catalogue, which is what bounds the table at one row per real
      // product per day rather than one per slug anybody cares to make up.
      if (getProduct(key)) await recordProductView(key);
    } else if (kind === "surface") {
      if (SURFACES.has(key)) await recordSurfaceView(key);
    } else if (kind === "search") {
      const text = normaliseQuery(key);
      // The result count is computed here and never read from the request. A client-supplied
      // figure is one the caller chooses, and the zero-result panel is only worth having because
      // the number behind it is ours.
      if (text) await recordSearch(text, search(text).length);
    }
  } catch (error) {
    // A counter is not worth an error page, and there is nothing to retry.
    console.error("Tracking write failed:", error);
  }

  return noContent();
}

/** Lowercased, whitespace collapsed, capped at 80 characters, and dropped unless it has a letter
 *  or a digit in it — so punctuation alone cannot open a row. */
function normaliseQuery(input: string): string | null {
  const text = input.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
  return /[\p{L}\p{N}]/u.test(text) ? text : null;
}
