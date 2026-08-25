import Image from "next/image";
import type { Product } from "@/lib/catalog";

/*
  Product media. One shot per view the manufacturer publishes — front of pack, back panel, the
  supplement-facts photograph — because on a supplement the back of the pack is the part a
  shopper actually wants to read.

  State lives in radio inputs and the switching is done in CSS (`.gallery` in globals.css), so
  the control is a real form control: keyboard-operable, no client JS, no hydration. A product
  with a single shot renders the frame alone.
*/
export function ProductGallery({ product }: { product: Product }) {
  const shots = product.images.slice(0, 4);
  const alt = `${product.brand} ${product.title}`;

  return (
    <div className="gallery">
      {shots.length > 1 &&
        shots.map((src, i) => (
          <input
            key={src}
            type="radio"
            name="pdp-shot"
            id={`pdp-shot-${i}`}
            defaultChecked={i === 0}
            className="sr-only"
            aria-label={`View ${i + 1} of ${shots.length}`}
          />
        ))}

      <div className="frame group relative aspect-square overflow-hidden rounded-tile border border-line bg-paper">
        {shots.map((src, i) => (
          // Single-shot products never get a radio, so that one frame has to show unconditionally.
          <div key={src} className={shots.length > 1 ? "shot absolute inset-0 overflow-hidden" : "absolute inset-0 overflow-hidden"}>
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt} — view ${i + 1}`}
              fill
              sizes="(max-width: 1024px) 90vw, 440px"
              priority={i === 0}
              className="object-contain p-6 transition-transform duration-300 will-change-transform group-hover:scale-[1.08]"
            />
          </div>
        ))}

        {product.discount && (
          <span className="kicker absolute left-0 top-0 z-10 rounded-br-tile bg-sale-600 px-2.5 py-1.5 text-white">
            −{product.discount}%
          </span>
        )}
      </div>

      {shots.length > 1 && (
        <ul className="thumbs mt-3 flex gap-2" role="list">
          {shots.map((src, i) => (
            <li key={src}>
              <label
                htmlFor={`pdp-shot-${i}`}
                className="thumb relative block h-16 w-16 cursor-pointer overflow-hidden rounded-card border border-line bg-paper transition-colors hover:border-plum-700"
              >
                <Image src={src} alt="" fill sizes="64px" className="object-contain p-1.5" />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
