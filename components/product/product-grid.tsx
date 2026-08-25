import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product/product-card";
import { Rail } from "@/components/ui/rail";

/** Dense 5-up grid at desktop, matching the catalog-first feel of the reference. */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product, i) => (
        <ProductCard key={product.slug} product={product} priority={i < 5} />
      ))}
    </div>
  );
}

/** Same card in a scrolling row, for home-page sections. */
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <Rail>
      {products.map((product, i) => (
        <div key={product.slug} className="w-[46%] shrink-0 sm:w-[31%] lg:w-[23%] xl:w-[19%]">
          <ProductCard product={product} priority={i < 3} />
        </div>
      ))}
    </Rail>
  );
}
