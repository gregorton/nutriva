import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { savedSlugs } from "@/lib/saved";
import { reviewsByUser } from "@/lib/reviews";
import { HeartIcon, StarIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Your account" };

/*
  Overview: two counts and where they lead. There is no order history, no address book and no
  payment methods, because there is no checkout behind this storefront — an account here exists
  to attribute a review and to hold a list.
*/
export default async function AccountPage() {
  const user = await requireUser("/account");
  const [saved, reviews] = await Promise.all([savedSlugs(user.id), reviewsByUser(user.id)]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SummaryTile
        href="/account/saved"
        icon={<HeartIcon className="h-5 w-5 text-plum-700" filled={saved.length > 0} />}
        label="Saved items"
        value={saved.length}
        empty="Nothing saved yet. The heart on any product card adds it here."
      />
      <SummaryTile
        href="/account/reviews"
        icon={<StarIcon className="h-5 w-5 text-star" />}
        label="Reviews written"
        value={reviews.length}
        empty="No reviews yet. Any product page has the form at the foot of it."
      />
    </div>
  );
}

function SummaryTile({
  href,
  icon,
  label,
  value,
  empty,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  empty: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-tile border border-line bg-paper p-6 transition-colors hover:border-line-strong hover:bg-white"
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <p className="kicker text-muted">{label}</p>
      </div>
      <p className="mt-3 font-display text-[34px] leading-none" data-num>
        {value}
      </p>
      {value === 0 && <p className="facts mt-2 max-w-[36ch]">{empty}</p>}
    </Link>
  );
}
