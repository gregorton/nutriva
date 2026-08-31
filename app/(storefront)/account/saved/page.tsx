import type { Metadata } from "next";
import { getProduct } from "@/lib/catalog";
import { requireUser } from "@/lib/dal";
import { savedSlugs } from "@/lib/saved";
import { ProductGrid } from "@/components/product/product-grid";
import { AccountHeading, EmptyPanel } from "@/components/account/account-panels";
import { HeartIcon } from "@/components/ui/icons";

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
      <EmptyPanel
        icon={<HeartIcon className="h-6 w-6 text-plum-700" />}
        title="Nothing saved yet"
        action={{ href: "/c/vitamins", label: "Browse vitamins" }}
      >
        The heart on a product card or product page keeps it here. Saved items are private to your
        account.
      </EmptyPanel>
    );
  }

  return (
    <>
      <AccountHeading
        title="Saved items"
        count={`${products.length} saved${retired > 0 ? ` · ${retired} no longer stocked` : ""}`}
      />
      <ProductGrid products={products} />
    </>
  );
}
