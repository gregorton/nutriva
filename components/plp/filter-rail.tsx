import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { brandsIn, formsIn } from "@/lib/catalog";
import { price } from "@/lib/format";
import { toggleHref, values, type RawSearchParams } from "@/lib/query";
import { PRICE_BUCKETS } from "@/lib/listing";
import { CheckIcon } from "@/components/ui/icons";

/**
 * Filter rail built from links rather than form controls: every option is a URL, so
 * filters are shareable, back-navigable and work before any JavaScript loads.
 */
export function FilterRail({
  base,
  raw,
  /** the category's items before filtering, so counts stay stable as options are picked */
  pool,
  /** A brand page is already one brand, so it suppresses that group. */
  showBrands = true,
}: {
  base: string;
  raw: RawSearchParams;
  pool: Product[];
  showBrands?: boolean;
}) {
  const selectedBrands = values(raw, "brand");
  const selectedForms = values(raw, "form");
  const selectedPrices = values(raw, "price");
  const onSale = values(raw, "sale").includes("1");
  const inStockOnly = values(raw, "stock").includes("1");
  const minRating = values(raw, "rating")[0];

  const brands = brandsIn(pool).slice(0, 10);
  const forms = formsIn(pool).slice(0, 6);
  const saleCount = pool.filter((p) => p.discount).length;
  const stockCount = pool.filter((p) => p.inStock).length;

  const cheapest = Math.min(...pool.map((p) => p.price));
  const dearest = Math.max(...pool.map((p) => p.price));

  return (
    <div className="space-y-7">
      <Group heading="Price">
        <p className="facts mb-2" data-num>
          {price(cheapest)} – {price(dearest)} across these products
        </p>
        <ul className="space-y-1.5">
          {PRICE_BUCKETS.map((bucket) => {
            const count = pool.filter((p) => p.price >= bucket.min && p.price < bucket.max).length;
            if (count === 0) return null;
            return (
              <Option
                key={bucket.id}
                href={toggleHref(base, raw, "price", bucket.id)}
                label={bucket.label}
                count={count}
                checked={selectedPrices.includes(bucket.id)}
              />
            );
          })}
        </ul>
      </Group>

      <Group heading="Availability">
        <ul className="space-y-1.5">
          <Option
            href={toggleHref(base, raw, "stock", "1")}
            label="In stock only"
            count={stockCount}
            checked={inStockOnly}
          />
          <Option
            href={toggleHref(base, raw, "sale", "1")}
            label="On offer"
            count={saleCount}
            checked={onSale}
          />
        </ul>
      </Group>

      <Group heading="Rating">
        <ul className="space-y-1.5">
          {["4.5", "4.0"].map((threshold) => (
            <Option
              key={threshold}
              href={toggleHref(base, raw, "rating", threshold)}
              label={`${threshold} and above`}
              count={pool.filter((p) => p.rating >= Number(threshold)).length}
              checked={minRating === threshold}
            />
          ))}
        </ul>
      </Group>

      {forms.length > 0 && (
        <Group heading="Format">
          <ul className="space-y-1.5">
            {forms.map((form) => (
              <Option
                key={form.name}
                href={toggleHref(base, raw, "form", form.name)}
                label={form.name}
                count={form.count}
                checked={selectedForms.includes(form.name)}
              />
            ))}
          </ul>
        </Group>
      )}

      {showBrands && (
      <Group heading="Brand">
        <ul className="space-y-1.5">
          {brands.map((brand) => (
            <Option
              key={brand.name}
              href={toggleHref(base, raw, "brand", brand.name)}
              label={brand.name}
              count={brand.count}
              checked={selectedBrands.includes(brand.name)}
            />
          ))}
        </ul>
      </Group>
      )}
    </div>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="kicker mb-2.5 border-b border-line pb-2 text-muted">{heading}</h3>
      {children}
    </section>
  );
}

function Option({
  href,
  label,
  count,
  checked,
}: {
  href: string;
  label: string;
  count: number;
  checked: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-pressed={checked}
        className="group flex items-center gap-2.5 py-0.5 text-[13.5px] text-ink hover:text-plum-700"
      >
        <span
          className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
            checked
              ? "border-plum-700 bg-plum-700 text-white"
              : "border-line-strong bg-white group-hover:border-plum-600"
          }`}
        >
          {checked && <CheckIcon className="h-3 w-3" />}
        </span>
        <span className="flex-1 truncate">{label}</span>
        <span className="facts shrink-0" data-num>
          {count}
        </span>
      </Link>
    </li>
  );
}
