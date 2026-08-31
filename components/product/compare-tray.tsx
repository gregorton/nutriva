"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { getProduct } from "@/lib/catalog";
import {
  clearCompare,
  compareHref,
  compareServerSnapshot,
  compareSnapshot,
  subscribeToCompare,
  toggleCompare,
} from "@/components/product/compare-store";
import { CloseIcon } from "@/components/ui/icons";

/**
 * The bar that appears once two products are ticked, anywhere on the storefront.
 *
 * Mounted once in the shell, and renders nothing below two selections — including on the server, so
 * it costs a prerendered page no markup. It links to /compare with the slugs in the URL, which is
 * where the comparison actually lives.
 */
export function CompareTray() {
  const selected = useSyncExternalStore(subscribeToCompare, compareSnapshot, compareServerSnapshot);
  const pathname = usePathname();
  const products = selected.map(getProduct).filter((product) => product !== undefined);

  // On /compare the page is the comparison, so a bar offering to open it would sit over its own
  // last row for nothing.
  if (products.length < 2 || pathname === "/compare") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="pointer-events-auto flex max-w-full animate-tray-up items-center gap-3 rounded-tile border border-line-strong bg-white px-3 py-2.5 shadow-[0_18px_40px_-20px_rgba(43,15,32,0.5)]">
        <ul className="flex gap-2">
          {products.map((product) => (
            <li key={product.slug} className="relative">
              <span className="relative block h-12 w-12 overflow-hidden rounded-[7px] bg-paper">
                <Image src={product.image} alt="" fill sizes="48px" className="object-contain p-1" />
              </span>
              <button
                type="button"
                onClick={() => toggleCompare(product.slug)}
                aria-label={`Remove ${product.title} from the comparison`}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-line-strong bg-white text-muted transition-colors hover:text-ink"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden sm:block">
          <p className="text-[13px] font-semibold text-ink">
            Comparing <span data-num>{products.length}</span>
          </p>
          <button
            type="button"
            onClick={clearCompare}
            className="facts text-plum-700 underline underline-offset-4 hover:text-plum-600"
          >
            Clear
          </button>
        </div>

        <Link
          href={compareHref(products.map((product) => product.slug))}
          className="btn-cart h-10 shrink-0 px-4 text-[14px]"
        >
          Compare
        </Link>
      </div>
    </div>
  );
}
