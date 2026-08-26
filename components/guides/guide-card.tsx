import Image from "next/image";
import Link from "next/link";
import { type Guide, creditLine } from "@/lib/guides";

/*
  Guide cards, in the three sizes the site needs. All three are one link, the same way product
  cards are, and all three lead with the photograph — which is the change: the strip used to be
  typographic on the theory that the question was the draw, and it read as a wall of small print
  next to a page otherwise full of product shots.

  The photo credit rides on the card only in the feature size, where there is room for it. Every
  other placement leaves crediting to the article page, which always prints it.
*/

function Meta({ guide, className = "" }: { guide: Guide; className?: string }) {
  return (
    <p className={`facts flex items-center gap-2 ${className}`}>
      <span className="kicker text-plum-700">{guide.tag}</span>
      <span className="h-3 w-px bg-line-strong" aria-hidden />
      <span data-num>{guide.minutes} min read</span>
    </p>
  );
}

/** Lead slot: 16:9 photograph over the headline, standfirst and the first takeaway. */
export function GuideFeature({ guide, priority = false }: { guide: Guide; priority?: boolean }) {
  const credit = creditLine(guide.photo);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_14px_36px_-24px_rgba(43,15,32,0.5)]">
      {guide.photo && (
        <div className="relative aspect-[16/9] overflow-hidden bg-paper">
          <Image
            src={guide.photo.file}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 700px"
            priority={priority}
            className="object-cover"
          />
          <span className="kicker absolute left-0 top-0 bg-plum-800 px-2.5 py-1.5 text-turmeric-200">
            {guide.tag}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <Meta guide={guide} />
        <h3 className="mt-2 font-display text-[24px] leading-tight sm:text-[27px]">
          <Link href={`/guides/${guide.slug}`} className="static before:absolute before:inset-0">
            {guide.title}
          </Link>
        </h3>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{guide.dek}</p>
        <p className="mt-4 border-t border-line pt-3 text-[13.5px] leading-snug text-ink">
          {guide.takeaways[0]}
        </p>
        {credit && <p className="facts mt-3 text-faint">Photo: {credit}</p>}
      </div>
    </article>
  );
}

/** Grid slot: 3:2 photograph, headline, standfirst. */
export function GuideCard({ guide, priority = false }: { guide: Guide; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_10px_30px_-22px_rgba(43,15,32,0.5)]">
      {guide.photo && (
        <div className="relative aspect-[3/2] overflow-hidden bg-paper">
          <Image
            src={guide.photo.file}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 400px"
            priority={priority}
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <Meta guide={guide} />
        <h3 className="mt-1.5 font-display text-[18px] leading-tight">
          <Link href={`/guides/${guide.slug}`} className="static before:absolute before:inset-0">
            {guide.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-[13.5px] leading-snug text-muted">{guide.dek}</p>
      </div>
    </article>
  );
}

/** List slot: square thumbnail beside the headline, for a column next to the feature. */
export function GuideRow({ guide }: { guide: Guide }) {
  return (
    <article className="group relative flex gap-3.5 py-3.5 first:pt-0 last:pb-0">
      {guide.photo && (
        <Link
          href={`/guides/${guide.slug}`}
          tabIndex={-1}
          aria-hidden
          className="relative h-[70px] w-[100px] shrink-0 overflow-hidden rounded-[7px] bg-paper sm:h-[80px] sm:w-[116px]"
        >
          <Image src={guide.photo.file} alt="" fill sizes="116px" className="object-cover" />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <Meta guide={guide} />
        <h3 className="mt-1 font-display text-[16px] leading-tight">
          <Link
            href={`/guides/${guide.slug}`}
            className="static line-clamp-2 group-hover:text-plum-700 before:absolute before:inset-0"
          >
            {guide.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{guide.dek}</p>
      </div>
    </article>
  );
}
