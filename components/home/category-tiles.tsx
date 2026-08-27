import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, byCategory, categoryCount, products } from "@/lib/catalog";

/**
 * Category entry points. Each tile shows a real product from that category rather than an
 * icon, so the shelf reads as stock rather than navigation furniture.
 */
export function CategoryTiles() {
  return (
    <section className="shell mt-14" id="shelf">
      <p className="kicker mb-1.5 text-muted" data-num>
        {CATEGORIES.length} categories · {products.length} products
      </p>
      <h2 className="text-[22px] sm:text-[26px]">Shop the shelf</h2>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((category) => {
          const lead = byCategory(category.slug)[0];

          return (
            <li key={category.slug}>
              <Link
                href={`/c/${category.slug}`}
                className="group flex h-full flex-col items-center rounded-card border border-line bg-white p-4 text-center transition-colors hover:border-line-strong hover:bg-paper"
              >
                <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full bg-paper">
                  {lead && (
                    <Image
                      src={lead.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <h3 className="font-sans text-[13.5px] font-semibold tracking-normal text-ink">{category.name}</h3>
                <p className="facts mt-1" data-num>
                  {categoryCount(category.slug)} items
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
