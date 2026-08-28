"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleSavedItem } from "@/app/actions/saved";
import { setSavedLocally, useAccount } from "@/components/account/account-store";
import { HeartIcon } from "@/components/ui/icons";

/*
  Save a product. Two placements: a circle over the corner of a card image, and a labelled row on
  the product page.

  Like the review form, this cannot be server-rendered per reader — the pages it sits on are
  prerendered — so the saved set comes from the account store and the button is drawn from it
  after hydration. Signed out, it is a link to sign in rather than a button that would fail.

  On a card it has to sit at z-20: the card is one big anchor (`before:inset-0` on the title
  link, z-10), so anything meant to be separately clickable has to be layered above it, the same
  way QuickAdd is.
*/
export function SaveButton({
  slug,
  variant = "card",
}: {
  slug: string;
  variant?: "card" | "inline";
}) {
  const { user, saved, loaded } = useAccount();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isSaved = saved.includes(slug);
  const label = isSaved ? "Saved, press to remove from your list" : "Save for later";

  function toggle() {
    // Optimistic: the heart fills on press, and reverts if the server disagrees.
    const next = !isSaved;
    setSavedLocally(slug, next);
    startTransition(async () => {
      const result = await toggleSavedItem(slug);
      if (result.ok) {
        setSavedLocally(slug, result.saved);
      } else {
        setSavedLocally(slug, !next);
        if (result.reason === "signed-out") {
          router.push(`/signin?next=${encodeURIComponent(`/p/${slug}`)}`);
        }
      }
    });
  }

  if (variant === "inline") {
    if (!loaded || !user) {
      return (
        <a
          href={`/signin?next=${encodeURIComponent(`/p/${slug}`)}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-plum-700 hover:underline"
        >
          <HeartIcon className="h-[18px] w-[18px]" />
          Save for later
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={isSaved}
        className="inline-flex items-center gap-2 text-sm font-medium text-plum-700 transition-opacity hover:underline disabled:opacity-60"
      >
        <HeartIcon className="h-[18px] w-[18px]" filled={isSaved} />
        {isSaved ? "Saved" : "Save for later"}
      </button>
    );
  }

  const shell =
    "absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white/95 text-plum-700 shadow-[0_2px_8px_-4px_rgba(43,15,32,0.5)] transition-colors hover:border-plum-600 hover:text-plum-600";

  if (!loaded || !user) {
    return (
      <a href={`/signin?next=${encodeURIComponent(`/p/${slug}`)}`} className={shell} aria-label="Sign in to save">
        <HeartIcon className="h-4 w-4" />
      </a>
    );
  }

  return (
    <button type="button" onClick={toggle} disabled={pending} aria-pressed={isSaved} aria-label={label} className={shell}>
      <HeartIcon className="h-4 w-4" filled={isSaved} />
    </button>
  );
}
