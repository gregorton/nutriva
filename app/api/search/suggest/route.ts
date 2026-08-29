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

  `Netlify-Vary` is not optional, and leaving it off shipped a bug no local run can show. Netlify's
  adapter keys its edge and durable caches on `__nextDataReq` and `_rsc` only, so a `public`
  response is stored under a key that ignores `q` — the first query cached (the panel prefetches
  the empty one on focus) was then served to every later query, and the live field predicted
  nothing while `next dev`, with no CDN in front of it, behaved perfectly. Declaring `query=q`
  puts the query back in the key. Any future cacheable handler that reads a search param needs the
  same line.
*/
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  return Response.json(suggest(query), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Netlify-Vary": "query=q",
    },
  });
}
