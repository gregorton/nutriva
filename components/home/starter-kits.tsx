import Link from "next/link";
import { KITS } from "@/lib/starters";
import { ProductCard } from "@/components/product/product-card";
import { Rail } from "@/components/ui/rail";
import { ArrowIcon } from "@/components/ui/icons";
import { FlashCountdown } from "@/components/home/flash-countdown";

/**
 * Starter kits — now a flash-deals style band.
 *
 * Looks exactly like the reference Daily Flash Deals rail: peach container,
 * title + per-digit red timer + subtitle on the left, "View all" with a
 * white circle arrow on the right, and the normal ProductCard swiper for
 * the products that are inside the kits.
 *
 * No bundle-math copy, no "Two or three bottles..." jargon, no promise
 * paragraphs — the value is the product itself at its regular price.
 */
export function StarterKits() {
  if (KITS.length === 0) return null;

  // Flatten kits to distinct products, preserving the KITS volume order.
  const seen = new Set<string>();
  const products: (typeof KITS)[number]["items"][number]["product"][] = [];
  for (const kit of KITS) {
    for (const { product } of kit.items) {
      if (!seen.has(product.slug)) {
        seen.add(product.slug);
        products.push(product);
      }
    }
  }

  return (
    <section className="shell mt-14">
      <div className="rounded-[12px] bg-[#FFE8CC] px-3 py-4 sm:px-5 sm:py-6">
        {/* Header: mirrors the reference image — title + red timer left, View all right, subtitle below */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[18px] font-extrabold leading-none tracking-tight text-[#1a1a1a] sm:text-[20px]">
                Starter kits
              </h2>
              <FlashCountdown />
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-[#6b5a4f]">
              Best sellers for a first shelf — check back for what&apos;s in stock.
            </p>
          </div>

          <Link
            href="/starters"
            className="group inline-flex shrink-0 items-center gap-2 text-[13px] font-semibold text-[#1a1a1a] hover:underline"
          >
            <span>View all {KITS.length} kits</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-transform group-hover:translate-x-0.5">
              <ArrowIcon className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {/* Rail: normal product swiper, just with the starter-kit products */}
        <div className="mt-4">
          <Rail>
            {products.map((product, i) => (
              <div key={product.slug} className="w-[46%] shrink-0 sm:w-[31%] lg:w-[23%] xl:w-[19%]">
                <ProductCard product={product} priority={i < 3} />
              </div>
            ))}
          </Rail>
        </div>
      </div>
    </section>
  );
}
