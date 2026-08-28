import Image from "next/image";

/**
 * The Slim Wellness Asia lockup — the client's own artwork, so it is placed rather than drawn.
 *
 * The file is cropped tight to the artwork by `reference/brand/icons.mjs`, which means callers
 * size it by height alone and get the optical size they asked for; the width follows from the
 * lockup's 185:146. Transparent, so it sits on the white masthead and the `paper` footer without
 * a plate. It is a stacked lockup rather than a horizontal wordmark, so it wants more height than
 * a line of type would — see the two heights the masthead gives it.
 *
 * `className` sets the height (`h-13`, `h-9`…). Do not constrain the width as well: the intrinsic
 * ratio below is what keeps the script from stretching.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logos/slim-wellness-asia.png"
      alt="Slim Wellness Asia"
      width={185}
      height={146}
      priority
      className={`w-auto ${className}`}
    />
  );
}
