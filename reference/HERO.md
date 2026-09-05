<!-- Split out of CLAUDE.md, which has a size budget. The hero is the most intricate component on the
     site and the least often touched; CLAUDE.md keeps the rules that bite from outside it and points
     here for the rest. -->

# Home page and hero

`components/home/hero-carousel.tsx` — the only client component above the fold — holds two tabs, each with its own
slideshow. `home-hero.tsx` is the server half and the only one that imports `lib/catalog.ts`. They meet at the types
in `hero-slides.ts`.

- **The pill switches topic, the arrows move within it.** Supplements runs the shelves off `CATEGORIES`; Medical
  equipment runs four ranges from `equipment-glyphs.tsx` as line art — no prices, no catalogue behind it, and the tab
  is `locked`: `aria-disabled` with a no-op press, **not** `disabled`, which gets no pointer events and so loses the
  cursor and title that say why.
- **No arrow crosses to the other topic, and it wraps both ways**, so no button ever disables itself — one that does
  so as it fires hands keyboard focus back to the document. **It rotates on its own** (`ROTATE_MS`), held on hover or
  focus, never started under `prefers-reduced-motion`; **no pause control**, the one place the hero misses WCAG 2.2.2.
- **Two nested tracks, not one** — flat, a tab switch animates through intervening slides. Each tab keeps its own
  position; every slide stays mounted for a stable height and carries **`inert` unless on screen**, or an off-screen
  CTA is a tab stop for a slide nobody can see.
- **Slide photographs are imported — never `existsSync` against `public/`.** That check runs wherever the page
  renders, so on a host with no real filesystem it answers false for a file that is deployed and serving, and the
  slide ships blank. `SHELVES` pairs shelf to an imported image, so a missing file is a build error.
  `trust-band.tsx` carries the same rule.
- **Every shot must be composed like the flat-lay** — subject in the right-hand two thirds, bare wood left, because
  the copy column sits in its left 43%. **Slides carry photographs and copy, never products**: best-seller tiles used
  to sit beside the copy, repeating the grids below. **21:9 from `lg` up, content-driven below**, where 21:9 is a
  160px letterbox; one `Image` carries both compositions, so the hero preloads one file.

**Nothing below the hero is two product rails in a row.** Best sellers, Just landed and Highest rated used to run one
after another — three swipes through much the same cards under three headings — so goals, the shelves, where you left
off, the trust band and the guides are interleaved, editorial ahead of the last two because a guide is worth more
before a decision than after. `shop-by-goal.tsx` finally puts `GOALS` on a page (it lived only in the nav's hover
panel, so a phone never saw it), and `for-you-rail.tsx` is one rail keyed to the shelf the recently-viewed list mostly
belongs to. Both personal bands render **nothing** on the server and nothing on a first visit.


## Below the hero

**Nothing below the hero is two product rails in a row.** Best sellers, Just landed and Highest rated used to run one
after another — three swipes through much the same cards under three headings — so goals, the shelves, the trust band and
the guides are interleaved, editorial ahead of the last two because a guide is worth more before a decision than after.

- `shop-by-goal.tsx` finally puts `GOALS` on a page: it lived only in the nav's hover panel, so a phone never saw it.
- `for-you-rail.tsx` is one rail keyed to the shelf the recently-viewed list mostly belongs to.
- **Both personal bands render nothing on the server and nothing on a first visit** — `RecentlyViewedStrip` under the hero
  is bare bottles, not a fourth grid of cards.
