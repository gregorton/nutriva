# iHerb (th.iherb.com) — reference capture

Screenshots in `shots/`, captured 2026-08-25 at 1440×900 (desktop) and 390×844 (mobile).
Re-capture with:

```bash
node reference/capture.mjs
```

## Measured tokens (computed styles, not eyeballed)

| Token | Value |
|---|---|
| Brand green (header, nav, primary buttons, regular price) | `#458500` |
| Add-to-cart / conversion CTA | `#F38A00` orange, white text, radius `8px`, 18px |
| Sale price | `#CA2222` |
| Struck-through original price | `#666666` |
| Body text | `#333333` |
| Deal-section tint | `#FAE8C1` (warm sand) |
| Radii in use | `8px` cards/buttons, `24px`/`48px` pills |
| Type scale | 12 / 14 / 16 / 18 / 24 / 40px; weights 400 / 500 / 700 |
| Body size | 14px (dense, catalog-first) |
| Layout | full-bleed 1440 shell, ~1380px content, 6-up product grid |

Two-font system: `FontBranded*` for marketing/headings, `FontUniversal*` for UI/body.

## Page anatomy

**Home** — utility strip (promo chip, countdown, free-shipping threshold, locale `TH | TH | THB`) → green masthead (logo, full-width search, account, cart) → category nav row with red "Deals" accent → hero mosaic (1 large + 4 tiles) → daily-deals carousel on sand background with live countdown + per-item "claimed %" progress bars → special deals → circular category icons + condition pills (immunity, heart, mood, sleep…) → trending → best sellers with category tabs → quality-promise band (dark blue, lab imagery, 4 trust points) → brand logo carousel → new arrivals → **iHerb LIVE** real-time purchase feed with country flags → editorial/health-topic strip → footer (locale, Google seller rating 4.8, ISO/GMP/NSF badges, 4 link columns, app QR + store badges, email capture).

**Category (PLP)** — H1 → promo banner carousel → subcategory circles → left rail filters (popular filters as pills, category counts, brand search + counts, rating) → result count + sort → 4-up grid with corner badges ("iHerb brand", "popular"), rating + review count, **"sold 60,000+ in the past 30 days"** social proof, price. An inline email-capture card and a promo tile are injected into the grid.

**Product (PDP)** — breadcrumbs (multi-path) → gallery with thumbnails + 360° spin → title, brand link, rating jump-link → in-stock + 30-day sales velocity → **best-seller rank per category** (#2 in Mascara) → sticky right buy box: price, discount %, struck price, qty stepper, orange add-to-cart, wishlist, quality-promise reassurance panel → frequently-bought-together carousel → product info accordion.

## What's worth borrowing

1. Urgency without lying — real countdown + "claimed 89%" bar.
2. Quantified social proof at every level — review counts, units sold in 30 days, category rank.
3. Trust architecture — quality promise on home, PLP and inside the buy box; certification badges in the footer.
4. Condition-based entry points (sleep, immunity, joints) alongside product taxonomy; supplement shoppers search by problem.
5. Locale/currency/free-shipping threshold pinned in the utility bar.
6. Reserving orange strictly for add-to-cart, green for brand, red for markdowns.

## What to do differently

- Density is high and hero real estate is spent on promos, not positioning — a smaller catalog reads better with editorial framing.
- Three overlapping interruptions (modal, sticky discount pill, cookie bar) fired within seconds. One at most.
- Mobile home overflows horizontally at 390px.
- Product cards carry 6+ competing elements; trimming to image, name, rating, price, one badge scans faster.
