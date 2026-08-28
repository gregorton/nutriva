import Link from "next/link";
import { SearchIcon } from "@/components/ui/icons";
import { AccountButton } from "@/components/account/account-button";
import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/chrome/logo";
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
        {/* The lockup is stacked, so it takes most of the masthead's height to keep
            "WELLNESS ASIA" legible: 7px of clearance in both states, which is as much as the
            72px row and its 58px condensed form will give it. */}
        <Link href="/" className="shrink-0" aria-label="Slim Wellness Asia home">
          <Logo className="h-[58px] transition-[height] duration-200 group-data-[stuck=true]/chrome:h-[44px]" />
        </Link>

        <form action="/search" className="relative hidden max-w-2xl flex-1 sm:block" role="search">
          <label htmlFor="site-search" className="sr-only">
            Search supplements
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder={`Search ${products.length} products: magnesium, whey, vitamin D…`}
            autoComplete="off"
            className="h-11 w-full rounded-card border border-line-strong bg-paper pl-4 pr-12 text-[15px] text-ink placeholder:text-faint focus:border-plum-600 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1 flex h-9 w-10 items-center justify-center rounded-[7px] text-plum-700 transition-colors hover:bg-plum-100"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/search"
            aria-label="Search supplements"
            className="flex h-10 w-10 items-center justify-center rounded-card text-plum-700 transition-colors hover:bg-plum-100 sm:hidden"
          >
            <SearchIcon className="h-[19px] w-[19px]" />
          </Link>
          <AccountButton />
          <CartButton />
        </div>
      </div>

      {/* Search collapses under the masthead on small screens rather than competing with the
          logo — and folds away entirely once the chrome is pinned, where the icon above stands
          in for it and the saved 52px is the difference between usable and covered. */}
      <form
        action="/search"
        className="shell pb-3 sm:hidden group-data-[stuck=true]/chrome:hidden"
        role="search"
      >
        <label htmlFor="site-search-mobile" className="sr-only">
          Search supplements
        </label>
        <div className="relative">
          <input
            id="site-search-mobile"
            name="q"
            type="search"
            placeholder="Search supplements"
            className="h-10 w-full rounded-card border border-line-strong bg-paper pl-3 pr-10 text-[15px] placeholder:text-faint focus:border-plum-600 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-[7px] text-plum-700"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </form>
    </header>
  );
}
