import Link from "next/link";
import type { Metadata } from "next";
import { getProduct } from "@/lib/catalog";
import { requireUser } from "@/lib/dal";
import { savedSlugs } from "@/lib/saved";
import { ProductGrid } from "@/components/product/product-grid";

export const metadata: Metadata = { title: "Saved items" };

export default async function SavedPage() {
  const user = await requireUser("/account/saved");
  const slugs = await savedSlugs(user.id);

  // Resolved against the catalogue, so a product retired by a refresh drops out of the list
  // rather than breaking it. Same rule the cart applies to a stale localStorage entry.
  const products = slugs.map(getProduct).filter((product) => product !== undefined);
  const retired = slugs.length - products.length;

  if (products.length === 0) {
    return (
      <div className="rounded-tile border border-line bg-paper px-6 py-14 text-center">
        <p className="text-[17px] font-medium text-ink">Nothing saved yet</p>
        <p className="mx-auto mt-2 max-w-[42ch] text-sm text-muted">
          The heart on a product card or product page keeps it here. Saved items are private to
          your account.
        </p>
        <Link
          href="/c/vitamins"
          className="mt-6 inline-flex rounded-card bg-plum-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
        >
          Browse vitamins
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="facts mb-5" data-num>
        {products.length} saved
        {retired > 0 && ` · ${retired} no longer stocked`}
      </p>
      <ProductGrid products={products} />
    </>
  );
}
