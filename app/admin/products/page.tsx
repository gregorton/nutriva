import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { topReviewedProducts, topSavedProducts, topViewedProducts } from "@/lib/admin-stats";
import { getProduct } from "@/lib/catalog";
import { RankTable } from "@/components/admin/rank-table";
import { reviewCount } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

const WINDOW = 30;
const TOP = 15;

/*
  What people look at, keep, and write about — the three signals this site can honestly produce about
  its own catalogue.

  None of them is `sold30d`. That figure is harvested from the source listing and describes trade
  somewhere else; these three describe this shop.

  The averages count our own reviews only. The source listing's aggregate is never mixed in, the same
  rule components/pdp/review-summary.tsx holds on the storefront.
*/
export default async function AdminProductsPage() {
  await requireAdmin("/admin/products");

  const [viewed, saved, reviewed] = await Promise.all([
    topViewedProducts(WINDOW, TOP),
    topSavedProducts(TOP),
    topReviewedProducts(TOP),
  ]);

  return (
    <div className="space-y-9">
      <section>
        <RankTable
          caption={`most opened · ${WINDOW}d`}
          columns={["Product", "Opened"]}
          rows={viewed.map((row) => ({
            key: row.slug,
            cells: [<ProductName key="p" slug={row.slug} />, reviewCount(row.count)],
          }))}
          empty="Nothing recorded yet. A product page counts itself the first time somebody who is not on the allowlist opens it."
        />
        <Note>
          One per product per browser, not per press of reload — and only browsers that run JavaScript,
          which leaves crawlers out. Anyone on the admin allowlist is excluded.
        </Note>
      </section>

      <section className="grid grid-cols-1 gap-9 lg:grid-cols-2">
        <div>
          <RankTable
            caption="most saved"
            columns={["Product", "Saved by"]}
            rows={saved.map((row) => ({
              key: row.slug,
              cells: [<ProductName key="p" slug={row.slug} />, reviewCount(row.count)],
            }))}
            empty="Nothing saved yet. The heart on any product card adds it."
          />
        </div>

        <div>
          <RankTable
            caption="most reviewed here"
            columns={["Product", "Reviews", "Average"]}
            rows={reviewed.map((row) => ({
              key: row.slug,
              cells: [
                <ProductName key="p" slug={row.slug} />,
                reviewCount(row.count),
                row.average.toFixed(1),
              ],
            }))}
            empty="No reviews yet."
          />
          <Note>
            Averaged over reviews written here. The catalogue’s own rating is a separate figure and the
            two are never combined.
          </Note>
        </div>
      </section>
    </div>
  );
}

/** A retired slug still names itself: the row is history, not a fault. */
function ProductName({ slug }: { slug: string }) {
  const product = getProduct(slug);
  if (!product) return <span className="text-term-dim">{slug} (retired)</span>;

  return (
    <Link href={`/p/${slug}`} className="transition-colors hover:text-term-cyan">
      {product.brand} {product.title}
    </Link>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 max-w-[64ch] text-[11.5px] leading-snug text-term-dim">{children}</p>;
}
