import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";

export default function NotFound() {
  return (
    <div className="shell py-24 text-center">
      <p className="kicker text-muted">404</p>
      <h1 className="mt-3 text-[30px]">That page has been discontinued</h1>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">
        The link may be out of date. Pick a category to carry on shopping.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/c/${category.slug}`}
              className="flex h-9 items-center rounded-full border border-line-strong bg-white px-4 text-[13.5px] font-medium transition-colors hover:border-plum-600 hover:text-plum-700"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
