"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, type CartLine as Line } from "@/components/cart/cart-context";
import { price } from "@/lib/format";
import { packLabel } from "@/lib/product-info";
import { CloseIcon } from "@/components/ui/icons";

/*
  One cart line, shared by the drawer and /cart so the two cannot drift.

  `size` is the only difference: the drawer is a 384px column, the page has room for the pack size
  and an explicit Remove. `available: false` renders the same line greyed with no stepper — see
  cart-context.tsx for why an unavailable line is kept rather than deleted.
*/
export function CartLine({
  line,
  size = "drawer",
  available = true,
  onNavigate,
}: {
  line: Line;
  size?: "drawer" | "page";
  available?: boolean;
  onNavigate?: () => void;
}) {
  const { setQty, remove } = useCart();
  const { product, qty } = line;
  const page = size === "page";
  const pack = packLabel(product);

  return (
    <li className={`flex gap-3 ${page ? "py-5" : "py-4"}`}>
      <Link
        href={`/p/${product.slug}`}
        onClick={onNavigate}
        className={`relative shrink-0 overflow-hidden rounded-[7px] bg-paper ${
          page ? "h-24 w-24" : "h-20 w-20"
        }`}
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes={page ? "96px" : "80px"}
          className={`object-contain p-1.5 ${available ? "" : "opacity-50 saturate-50"}`}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="facts truncate text-plum-700">{product.brand}</p>
        <Link
          href={`/p/${product.slug}`}
          onClick={onNavigate}
          className={`line-clamp-2 text-[13.5px] font-medium hover:text-plum-700 ${
            available ? "" : "text-muted"
          }`}
        >
          {product.title}
        </Link>

        {page && pack && (
          <p className="facts mt-1" data-num>
            {pack}
          </p>
        )}

        {available ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center rounded-[7px] border border-line-strong">
              <button
                type="button"
                onClick={() => setQty(product.slug, qty - 1)}
                className="h-8 w-8 text-muted transition-colors hover:bg-paper hover:text-ink"
                aria-label={
                  qty === 1 ? `Remove ${product.title}` : `Decrease quantity of ${product.title}`
                }
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium" data-num>
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(product.slug, qty + 1)}
                className="h-8 w-8 text-muted transition-colors hover:bg-paper hover:text-ink"
                aria-label={`Increase quantity of ${product.title}`}
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" data-num>
                {price(product.price * qty)}
              </span>
              {page && (
                <button
                  type="button"
                  onClick={() => remove(product.slug)}
                  className="rounded-[6px] p-1.5 text-faint transition-colors hover:bg-paper hover:text-ink"
                  aria-label={`Remove ${product.title}`}
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="facts font-medium text-sale-600">Out of stock</span>
            <button
              type="button"
              onClick={() => remove(product.slug)}
              className="facts text-plum-700 underline underline-offset-4 hover:text-plum-600"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
