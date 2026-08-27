"use server";

import { revalidatePath } from "next/cache";
import { getProduct } from "@/lib/catalog";
import { getUser } from "@/lib/dal";
import { toggleSaved } from "@/lib/saved";

/*
  Saving and unsaving. Called from a client button, so it returns the resulting state rather
  than revalidating a page: the hearts live on prerendered pages and the truth for them is the
  client store, filled from /api/session.

  /account/saved is the one server-rendered view of the same data, so that path is revalidated.
*/

export type SaveResult = { ok: true; saved: boolean } | { ok: false; reason: "signed-out" | "unknown-product" };

export async function toggleSavedItem(slug: string): Promise<SaveResult> {
  const user = await getUser();
  if (!user) return { ok: false, reason: "signed-out" };
  if (!getProduct(slug)) return { ok: false, reason: "unknown-product" };

  const saved = await toggleSaved(user.id, slug);
  revalidatePath("/account/saved");
  return { ok: true, saved };
}
