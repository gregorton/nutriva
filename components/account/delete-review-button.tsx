"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { removeReview, type ReviewState } from "@/app/actions/reviews";

/**
 * Deletes one review from /account/reviews. The server action revalidates the product page's
 * review tag; this refreshes the list you are looking at.
 */
export function DeleteReviewButton({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(removeReview, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

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
