import Link from "next/link";
import { AccountButton } from "@/components/account/account-button";
import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/chrome/logo";
import { SearchField, SearchRow, SearchTrigger } from "@/components/chrome/search-box";
import { products } from "@/lib/catalog";

/**
 * Masthead. Deliberately light against the plum utility strip and nav row, so the
 * search field — the primary way people find a supplement — is the brightest thing here.
 *
 * It rides in `StickyChrome`, so it has two heights: 72px at the top of a page, and 58px once
 * pinned, with the mobile search row folding away at the same moment. On a phone that row is
 * replaced by the search icon beside the cart, which is why the icon is there at every scroll
 * position rather than appearing on scroll.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="shell flex h-[72px] items-center gap-4 transition-[height] duration-200 group-data-[stuck=true]/chrome:h-[58px] sm:gap-8">
        {/* TEMPORARY: preview notice, to be deleted before launch. It shares a tight gap with
            the lockup rather than sitting in the row's own `gap-8`, so it reads as a note pinned
            beside the logo and pushes it right by as little as possible. Small and stacked on
            purpose — the preview should look finished, not plastered with a warning. */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <p
            lang="th"
            className="text-right text-[11px] font-medium leading-[1.35] text-red-700"
          >
            ยังไม่เสร็จ
            <br />
            พรีเวิว
          </p>

          {/* The lockup is stacked, so it takes most of the masthead's height to keep
              "WELLNESS ASIA" legible: 7px of clearance in both states, which is as much as the
              72px row and its 58px condensed form will give it. */}
          <Link href="/" className="shrink-0" aria-label="Slim Wellness Asia home">
            <Logo className="h-[58px] transition-[height] duration-200 group-data-[stuck=true]/chrome:h-[44px]" />
          </Link>
        </div>

        {/* The field, its dropdown and the phone sheet are one client island; the placeholder keeps
            its live count, which is why the catalogue is still imported here. */}
        <SearchField placeholder={`Search ${products.length} products: magnesium, whey, vitamin D…`} />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchTrigger />
          <AccountButton />
          <CartButton />
        </div>
      </div>

      {/* Search collapses under the masthead on small screens rather than competing with the
          logo — and folds away entirely once the chrome is pinned, where the icon above stands
          in for it and the saved 52px is the difference between usable and covered. */}
      <SearchRow />
    </header>
  );
}
