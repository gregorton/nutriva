import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { CONTACT } from "@/lib/contact";
import { Logo } from "@/components/chrome/logo";
import { ArrowIcon, CheckIcon } from "@/components/ui/icons";

const COLUMNS = [
  {
    heading: "Shop",
    links: [
      ["Starter kits", "/starters"],
      ["Deals", "/deals"],
      ["Best sellers", "/c/vitamins"],
      ["New arrivals", "/c/sports"],
      ["Medical equipment", "/equipment"],
    ],
  },
  {
    heading: "Help",
    links: [
      ["Delivery & tracking", "/help/delivery"],
      ["Returns", "/help/returns"],
      ["Order status", "/account/orders"],
      ["Contact us", "/help/contact"],
    ],
  },
  {
    heading: "About",
    links: [
      ["How we hold stock", "/quality"],
      ["Sourcing", "/sourcing"],
      ["Guides", "/guides"],
      ["Careers", "/careers"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="shell py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo className="h-16" />
            <p className="mt-3 max-w-xs text-sm text-muted">
              Supplements shipped from Bangkok, with the label read out in full on every product
              page.
            </p>
            <ul className="mt-4 space-y-1.5">
              {["Held below 25°C", "Shipped sealed", "60-day returns"].map((claim) => (
                <li key={claim} className="facts flex items-center gap-2 text-pandan-700">
                  <CheckIcon className="h-3.5 w-3.5" />
                  {claim}
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-line pt-5">
              <h2 className="kicker text-muted">Contact</h2>
              <address className="mt-2 not-italic text-sm leading-relaxed text-ink">
                {CONTACT.address.full}
              </address>
              <ul className="mt-3 space-y-1 text-sm">
                <li>
                  <a href={CONTACT.phones.tel.href} className="text-ink hover:text-plum-700 hover:underline">
                    Tel: {CONTACT.phones.tel.display}
                  </a>
                </li>
                <li>
                  <a href={CONTACT.phones.mobile.href} className="text-ink hover:text-plum-700 hover:underline">
                    Mobile: {CONTACT.phones.mobile.display}
                  </a>
                </li>
                <li className="pt-1 text-sm">
                  <a href={CONTACT.email.href} className="font-medium text-ink hover:text-plum-700 hover:underline">
                    {CONTACT.email.address}
                  </a>
                  <span className="text-muted"> · {CONTACT.hours}</span>
                </li>
              </ul>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="kicker text-muted">{column.heading}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-ink hover:text-plum-700 hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-[1fr_auto]">
          <nav aria-label="All categories">
            <h2 className="kicker text-muted">Categories</h2>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link href={`/c/${category.slug}`} className="text-sm text-muted hover:text-plum-700">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <form className="md:w-80">
            <label htmlFor="newsletter" className="kicker text-muted">
              Restock reminders
            </label>
            <p className="mt-2 text-sm text-muted">One email when your usual runs low, and nothing else.</p>
            <div className="mt-3 flex gap-2">
              <input
                id="newsletter"
                type="email"
                required
                placeholder="you@email.com"
                className="h-10 min-w-0 flex-1 rounded-[7px] border border-line-strong bg-white px-3 text-sm placeholder:text-faint focus:border-plum-600 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-10 items-center gap-1.5 rounded-[7px] bg-plum-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
              >
                Sign up
                <ArrowIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-4">
          <p className="facts">
            © {new Date().getFullYear()} Slim Wellness Asia Co., Ltd. · {CONTACT.address.full} ·{" "}
            <a href={CONTACT.phones.tel.href} className="hover:text-plum-700 hover:underline">
              {CONTACT.phones.tel.display}
            </a>{" "}
            ·{" "}
            <a href={CONTACT.email.href} className="hover:text-plum-700 hover:underline">
              {CONTACT.email.address}
            </a>
          </p>
          <ul className="flex flex-wrap gap-4">
            {[
              ["Privacy", "/legal/privacy"],
              ["Terms", "/legal/terms"],
              ["Cookies", "/legal/cookies"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="facts hover:text-plum-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="facts">TH · EN · ฿ THB</p>
        </div>
      </div>
    </footer>
  );
}
