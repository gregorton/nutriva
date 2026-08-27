"use client";

import { useSyncExternalStore } from "react";

/*
  Who is signed in, on the client.

  This is the cart's contract applied to the session: external mutable state read through
  useSyncExternalStore with an empty server snapshot, rather than copied into state inside an
  effect. The server render always says "nobody", hydration agrees, and the real answer arrives
  from /api/session on first subscribe.

  It exists because the masthead is in the root layout. A server component there awaiting
  cookies() would opt every route in the app into dynamic rendering and cost all 470 product
  pages their prerender — see components/cart/cart-context.tsx for the same reasoning applied to
  localStorage. The security boundary is unaffected: this only decides what the header prints,
  and every page and action that touches account data re-checks the session server-side through
  lib/dal.ts.
*/

export type AccountSnapshot = {
  user: { id: string; displayName: string } | null;
  saved: string[];
  /** False until the first response lands, so the button can stay quiet rather than flicker. */
  loaded: boolean;
};

const EMPTY: AccountSnapshot = { user: null, saved: [], loaded: false };

let snapshot: AccountSnapshot = EMPTY;
/*
  Every refresh gets a number, and only the newest one is allowed to write.

  An earlier version deduplicated concurrent calls by returning the in-flight promise, which is
  the wrong trade here: signing in fires a refresh while the one from first mount is often still
  open, and joining that older request resolves with "nobody is signed in" — so the masthead kept
  saying Sign in to somebody who had just signed in. Two small requests are cheaper than that bug.
*/
let requestSeq = 0;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function set(next: AccountSnapshot) {
  snapshot = next;
  emit();
}

/** Fetches the session. The most recently started call is the one whose answer sticks. */
export function refreshAccount(): Promise<void> {
  const seq = ++requestSeq;
  started = true;

  return fetch("/api/session", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : { user: null, saved: [] }))
    .then((data: { user: AccountSnapshot["user"]; saved: string[] }) => {
      if (seq !== requestSeq) return; // a newer refresh has already answered
      set({ user: data.user, saved: data.saved ?? [], loaded: true });
    })
    .catch(() => {
      // Offline or the database is down: the storefront still works signed out.
      if (seq === requestSeq) set({ ...EMPTY, loaded: true });
    });
}

/** Moves one slug in or out of the saved set without waiting for a round trip. */
export function setSavedLocally(slug: string, saved: boolean) {
  const has = snapshot.saved.includes(slug);
  if (has === saved) return;
  set({
    ...snapshot,
    saved: saved ? [slug, ...snapshot.saved] : snapshot.saved.filter((s) => s !== slug),
  });
}

function subscribe(listener: () => void): () => void {
  // First subscribe is the earliest point at which a fetch is safe.
  if (!started) void refreshAccount();
  listeners.add(listener);

  // Catches a sign-out performed in another tab, without polling.
  const onVisible = () => {
    if (document.visibilityState === "visible") void refreshAccount();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    listeners.delete(listener);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export function useAccount(): AccountSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}
