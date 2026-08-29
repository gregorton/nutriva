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
*/
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  return Response.json(suggest(query), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
