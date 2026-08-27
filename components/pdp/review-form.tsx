"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { myReviewDraft, submitReview, type ReviewState } from "@/app/actions/reviews";
import { useAccount } from "@/components/account/account-store";
import { StarIcon } from "@/components/ui/icons";

/*
  Write a review, or edit the one you already left.

  The product page is one of 470 prerendered documents, so it cannot know who is reading it. This
  starts as the sign-in prompt the server rendered — which is also what a signed-out reader keeps
  — and swaps to the form once the account store says there is somebody there.

  The form is split out and keyed on the account id so that signing out and back in as someone
  else mounts a fresh one, rather than needing an effect to clear the previous person's draft out
  of state. Effects that call setState synchronously are an error in this codebase (see the note
  on cart-context.tsx), so the only setState here happens in the fetch's callback.

  Nothing in this file is a permission check. The action re-verifies the session server-side.
*/
export function ReviewForm({ slug }: { slug: string }) {
  const { user, loaded } = useAccount();

  if (!loaded || !user) {
    return (
      <div className="rounded-card border border-line bg-white p-5">
        <p className="text-[15px] font-medium text-ink">Used this one?</p>
        <p className="mt-1.5 max-w-[52ch] text-sm text-muted">
          Reviews here are attributed to an account, so people can see who wrote what. Nothing
          else about you is shown.
        </p>
        <Link
          href={`/signin?next=${encodeURIComponent(`/p/${slug}#reviews`)}`}
          className="mt-4 inline-flex rounded-card bg-plum-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-plum-700"
        >
          Sign in to write a review
        </Link>
      </div>
    );
  }

  return <SignedInForm key={user.id} slug={slug} displayName={user.displayName} />;
}

function SignedInForm({ slug, displayName }: { slug: string; displayName: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, undefined);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hasExisting, setHasExisting] = useState(false);

  // Opens on what you wrote before, if anything. setState here runs in the promise callback,
  // not in the effect body.
  useEffect(() => {
    let cancelled = false;
    void myReviewDraft(slug).then((existing) => {
      if (cancelled || !existing) return;
      setRating(existing.rating);
      setTitle(existing.title);
      setBody(existing.body);
      setHasExisting(true);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // The action expired this product's review tag and called refresh(), so the list above is
  // already being re-rendered on the server; nothing to do here but note that a review exists.
  const editing = hasExisting || state?.ok === true;
  const errors = state?.errors;

  return (
    <form action={action} className="rounded-card border border-line bg-white p-5" noValidate>
      <input type="hidden" name="slug" value={slug} />

      <p className="text-[15px] font-medium text-ink">{editing ? "Your review" : "Write a review"}</p>
      <p className="mt-1 text-sm text-muted">
        {/* A middle dot, not a full stop: plenty of display names already end in one
            ("Ploy S."), and appending a period to those reads as a typo. */}
        Posting as {displayName} ·{" "}
        {editing ? "Saving replaces what you wrote before." : "One review per product."}
      </p>

      {state?.message && (
        <p role="alert" className="mt-3 text-[13px] text-sale-600">
          {state.message}
        </p>
      )}

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-ink">Your rating</legend>
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className="cursor-pointer rounded p-0.5 focus-within:outline focus-within:outline-2 focus-within:outline-turmeric-500"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <span className="sr-only">{value === 1 ? "1 star" : `${value} stars`}</span>
              <StarIcon
                className={`h-7 w-7 transition-colors ${value <= rating ? "text-star" : "text-line-strong"}`}
                filled={value <= rating}
              />
            </label>
          ))}
        </div>
        {errors?.rating && <p className="mt-1 text-[12.5px] text-sale-600">{errors.rating}</p>}
      </fieldset>

      <div className="mt-4">
        <label htmlFor="review-title" className="block text-sm font-medium text-ink">
          Headline <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="review-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          className="mt-1.5 h-11 w-full rounded-card border border-line-strong bg-paper px-3.5 text-[15px] focus:border-plum-600 focus:bg-white focus:outline-none"
        />
        {errors?.title && <p className="mt-1 text-[12.5px] text-sale-600">{errors.title}</p>}
      </div>

      <div className="mt-4">
        <label htmlFor="review-body" className="block text-sm font-medium text-ink">
          Your review
        </label>
        <p className="facts mt-0.5">
          What the pack was like, how you took it, whether you would buy it again.
        </p>
        <textarea
          id="review-body"
          name="body"
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          className="mt-1.5 w-full rounded-card border border-line-strong bg-paper px-3.5 py-2.5 text-[15px] leading-relaxed focus:border-plum-600 focus:bg-white focus:outline-none"
        />
        {errors?.body && <p className="mt-1 text-[12.5px] text-sale-600">{errors.body}</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-card bg-plum-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-plum-700 disabled:opacity-60"
        >
          {pending ? "Posting…" : editing ? "Save changes" : "Post review"}
        </button>
        {state?.ok && <p className="text-[13px] font-medium text-pandan-600">Saved.</p>}
      </div>
    </form>
  );
}
