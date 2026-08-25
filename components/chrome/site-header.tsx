import Link from "next/link";
import { SearchIcon, UserIcon } from "@/components/ui/icons";
import { CartButton } from "@/components/cart/cart-button";
import { Wordmark } from "@/components/chrome/wordmark";
import { products } from "@/lib/catalog";

/**
 * Masthead. Deliberately light against the plum utility strip and nav row, so the
 * search field — the primary way people find a supplement — is the brightest thing here.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="shell flex h-[72px] items-center gap-4 sm:gap-8">
        <Link href="/" className="shrink-0" aria-label="Nutriva home">
          <Wordmark />
        </Link>

        <form action="/search" className="relative hidden max-w-2xl flex-1 sm:block" role="search">
          <label htmlFor="site-search" className="sr-only">
            Search supplements
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder={`Search ${products.length} products — magnesium, whey, vitamin D…`}
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
            href="/account"
            className="hidden items-center gap-2 rounded-card px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper sm:flex"
          >
            <UserIcon className="h-[18px] w-[18px] text-plum-700" />
            <span>Sign in</span>
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Search collapses under the masthead on small screens rather than competing with the logo. */}
      <form action="/search" className="shell pb-3 sm:hidden" role="search">
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
