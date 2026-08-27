"use client";

import { useActionState } from "react";
import { removeReview, type ReviewState } from "@/app/actions/reviews";

/**
 * Deletes one review from /account/reviews. The action expires the product page's review tag and
 * calls `refresh()`, which re-renders this list on the server — so there is nothing for this
 * component to do but report a failure. It is the only client-side part of the row.
 */
export function DeleteReviewButton({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(removeReview, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        className="text-[13px] font-medium text-muted transition-colors hover:text-sale-600 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state?.message && <p className="mt-1 text-[12.5px] text-sale-600">{state.message}</p>}
    </form>
  );
}
