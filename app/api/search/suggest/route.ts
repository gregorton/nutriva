import { suggest } from "@/lib/search-suggest";

/*
  Search suggestions for the masthead field.

  The second route handler on the site, and the only one with no session behind it. It exists so
  the dropdown and the results page run the same `search()`: the rows previewed here are the rows
  `/search` delivers, because both call one function over one catalogue.

  Fetching rather than shipping an index is the whole point. `lib/catalog.generated.json` is 1.9MB
  and product rows need a thumbnail and a price, so a client-side index would land in the root
  layout's bundle on every one of 470 prerendered pages, for a feature most visits never open.
  This way the client payload stays at zero.

  Cacheable for everyone: the answer depends on the query and nothing else — no cookie is read
  here, unlike `/api/session`.

  `max-age` is the browser's cache and nothing else's. A Worker's response is not held at the edge
  unless a Cache Rule or the Cache API puts it there, so on Cloudflare every keystroke that misses
  the in-memory `Map` in search-box.tsx reaches this handler. That is affordable — `suggest()` is a
  synchronous scan of 470 rows with no database behind it.

  **If an edge cache is ever put in front of this, check that `q` is in its key.** Netlify's adapter
  keyed its caches on `__nextDataReq` and `_rsc` alone, so a `public` response was stored under a
  key that ignored `q`: the first query cached (the panel prefetches the empty one on focus) was
  served to every later query, and the live field predicted nothing while `next dev`, with no CDN in
  front of it, behaved perfectly. It needed a `Netlify-Vary: query=q` header to undo. Cloudflare
  keys on the full URL including the query string, so nothing is needed here — but a rule that
  strips or normalises query strings would bring the same bug back, and no local run can show it.
*/
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  return Response.json(suggest(query), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
