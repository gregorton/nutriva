<!-- Split out of CLAUDE.md, which has a size budget. Everything here is a rule about the six
     articles, their covers or the licensing. CLAUDE.md keeps the two that bite from outside:
     nothing is hand-linked to a product, and every cover needs its credit. -->

# Guides

`/guides` and `/guides/[slug]` are the one part of the site written rather than harvested. `lib/guides.ts` holds all six
articles as **structured data**, so there is no markdown renderer and nothing to sanitise, and reading time is counted
off those words so the label cannot drift.

## Copy

The catalogue's rules applied to prose: reference intakes are quoted as population figures and named as such, and no
sentence needs a study the site cannot show you. The COA guide and `/quality` both state that no laboratory stands
behind the shop.

## Covers

- `reference/editorial/photos.mjs` harvests one CC0 / public-domain / CC BY photograph per guide, writes the credit to
  `lib/editorial.generated.json`, and covers are pinned by image id in `PICKS`. `--candidates <slug>` lists options.
- **`guides-check.mjs` asserts a credit for every cover**: a missing one puts a CC BY image out of licence.

## Links to stock

**Nothing links an article to a product by hand.** `guideMentions()` takes the forms an article's own term/detail
bullets name — "D3 (cholecalciferol)", "Whey isolate" — and finds stock whose **title** opens a word with the same term
(`hasTermPrefix`, the test `search()` uses), so a bullet the catalogue cannot answer is dropped. Each section carries an
id derived from its heading, which the sidebar index links to.
