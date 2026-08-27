"use server";

import { refresh, revalidatePath, updateTag } from "next/cache";
import { getProduct } from "@/lib/catalog";
import { getUser } from "@/lib/dal";
import { deleteReview, moreReviews, myReview, upsertReview, type ReviewSlice } from "@/lib/reviews";
import { checkReview } from "@/lib/validate";

/*
  Review mutations. Each one re-checks the session through the DAL rather than trusting the
  caller — a Server Action is a POST endpoint, and the form that renders above it is not a
  guarantee that a form is what sent the request.

  The slug arrives in a hidden field, so it is checked against the catalogue before use: an
  unknown slug is rejected rather than written, which keeps the table free of rows no page can
  ever show.
*/

export type ReviewState = {
  errors?: Partial<Record<"rating" | "title" | "body", string>>;
  message?: string;
  ok?: boolean;
} | undefined;

function slugOf(form: FormData): string | null {
  const slug = form.get("slug");
  return typeof slug === "string" && getProduct(slug) ? slug : null;
}

export async function submitReview(_state: ReviewState, form: FormData): Promise<ReviewState> {
  const user = await getUser();
  if (!user) return { message: "Sign in to write a review." };

  const slug = slugOf(form);
  if (!slug) return { message: "That product is no longer in the catalogue." };

  const checked = checkReview(form);
  if (!checked.ok) return { errors: checked.errors };

  await upsertReview(slug, user.id, checked.value);
  // updateTag rather than revalidateTag: this is a read-your-own-writes case, so the next render
  // of this product page has to wait for the fresh query instead of being served the stale copy
  // that does not have the review in it yet. refresh() then pulls that render into the page the
  // writer is looking at — it is the server-side counterpart of router.refresh(), and the one
  // that works from an action.
  updateTag(`reviews:${slug}`);
  refresh();
  return { ok: true };
}

export async function removeReview(_state: ReviewState, form: FormData): Promise<ReviewState> {
  const user = await getUser();
  if (!user) return { message: "Sign in to manage your reviews." };

  const slug = slugOf(form);
  if (!slug) return { message: "That product is no longer in the catalogue." };

  await deleteReview(slug, user.id);
  updateTag(`reviews:${slug}`);
  // The account list is a dynamic route, so it needs its own nudge: revalidatePath drops the
  // copy the client router is holding, and refresh() re-renders the page being looked at.
  revalidatePath("/account/reviews");
  refresh();
  return { ok: true };
}

/**
 * Paging, called by the Load more button. A read, not a mutation — it is an action so the
 * product page can page through reviews without a `searchParams` read that would cost it its
 * prerender.
 */
export async function loadMoreReviews(slug: string, cursor: string): Promise<ReviewSlice> {
  if (!getProduct(slug)) return { reviews: [], cursor: null };
  return moreReviews(slug, cursor);
}

/**
 * What the signed-in reader has already written about this product, so the form opens as an edit
 * rather than a blank slate. Also a read: the product page is prerendered, so it cannot know who
 * is looking, and the form asks once it has hydrated and knows there is somebody to ask about.
 */
export async function myReviewDraft(
  slug: string,
): Promise<{ rating: number; title: string; body: string } | null> {
  const user = await getUser();
  if (!user || !getProduct(slug)) return null;

  const existing = await myReview(slug, user.id);
  return existing
    ? { rating: existing.rating, title: existing.title ?? "", body: existing.body }
    : null;
}
