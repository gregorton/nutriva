<!-- Split out of CLAUDE.md, which has a size budget. Everything here is a rule about the search
     island or the suggestion vocabulary. CLAUDE.md keeps the scoring rules, the cache header the
     whole deploy depends on, and the two traps that bite from outside this component. -->

# Search

Ranking in `lib/catalog.ts`, suggestion vocabulary in `lib/search-suggest.ts`, one client island in
`components/chrome/search-box.tsx`. `GET /api/search/suggest?q=` is the seam, so the panel and `/search` run the same
`search()` over the same 470 rows.

## Vocabulary and fallbacks

- **Only suggest what the stock holds.** `lib/search-suggest.ts` builds its vocabulary from what the repo already
  declares — categories, subcategory terms, brands, goals — counts each entry against the page it links to and **drops
  it at zero**, so it cannot drift from the catalogue.
- `didYouMean` is a Levenshtein pass over that vocabulary, used **only when a query scored nothing**.
- **Brands are their own kind of suggestion** and go to `/b/[brand]`, not a text query that also matches every title
  containing the word.
- **A zero-result panel still offers somewhere to go**: the correction first, then the popular shortlist; `/search`
  adds the busiest shelves. **Every count shown is the real size of the page the link opens.**

## One combobox, three placements

Anchored panel from `sm` up, the phone search row, and a full-screen sheet below `sm`.

- Sheet state lives in the **store module, not React context** — the three placements sit in three different parents.
- **The sheet is mounted by the icon trigger, not the row**, which folds away when the chrome pins.
- Every section flattens into **one flat `rows` array**, so keyboard handling never learns how many sections exist.
  Sections are `role="group"` and focus stays in the input.
- Recently viewed leads the untyped panel.
- Loading and failure sit **outside the listbox as `role="status"`** — neither is something an arrow key should land on.
- Each placement is a real GET `<form action="/search">`, so search works with JS off.
- **The closed panel is unmounted, never a transparent one left in flow** — that scrolls the page sideways at 375px.

## Fetching

- **Sequence-numbered, and in-flight deduplication must not come back**: joining an older request resolves with a stale
  answer.
- 120ms debounce, an `AbortController` per request, and a `Map` of query to response so backspacing is instant.
- Previous rows stay on screen while the next request is in flight, so the panel never flashes empty.
