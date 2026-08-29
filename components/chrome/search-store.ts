"use client";

import { useSyncExternalStore } from "react";
import type { Suggestions } from "@/lib/search-suggest";

/*
  The search field's client state: what the suggestion endpoint last answered, and what this
  visitor has searched for before.

  Both are external mutable state — one a network cache, one localStorage — so both are read
  through useSyncExternalStore with an empty server snapshot, the contract
  `components/cart/cart-context.tsx` and `components/account/account-store.ts` both hold. The
  server render always shows an empty panel, hydration agrees, and the real answer arrives after
  mount. Copying either into state inside an effect would mismatch on hydration and trip
  `react-hooks/set-state-in-effect`.

  No JSX here, so `search-box.tsx` holds only markup and keyboard logic.
*/

export type SearchSnapshot = {
  /** The query `data` answers — not necessarily what the input currently holds. */
  query: string;
  data: Suggestions | null;
  /** A request is open. The panel keeps showing `data` meanwhile rather than flashing empty. */
  loading: boolean;
  recent: string[];
  /** The phone sheet. Module state because the field, the masthead icon and the sheet itself are
   *  three siblings in three different corners of the masthead. */
  sheetOpen: boolean;
  /** What the sheet's input opens with — whatever the folded-away row already held. */
  sheetSeed: string;
};

const STORAGE_KEY = "swa.recent-searches.v1";
const MAX_RECENT = 6;
/** Long enough that a fast typist sends one request per word, short enough to feel immediate. */
const DEBOUNCE_MS = 120;

const EMPTY: SearchSnapshot = { query: "", data: null, loading: false, recent: [], sheetOpen: false, sheetSeed: "" };

let snapshot: SearchSnapshot = EMPTY;
const listeners = new Set<() => void>();
/** Normalised query -> answer, so backspacing and re-typing costs nothing. */
const cache = new Map<string, Suggestions>();
let loaded = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let controller: AbortController | null = null;
/*
  Every request gets a number and only the newest may write.

  `AbortController` alone is not enough: a reply already in flight when the next keystroke lands
  can resolve before the abort takes effect, and then a two-letter answer overwrites a five-letter
  one. This is the pattern `components/account/account-store.ts` arrived at for the same reason,
  and — as its comment records — in-flight *deduplication* is the thing to avoid: joining an older
  request answers the newer question with the older query's results.
*/
let requestSeq = 0;

function emit() {
  for (const listener of listeners) listener();
}

function set(next: Partial<SearchSnapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

/** Cache key. Matches `normalise` closely enough to hit on retyping; the server normalises again. */
function keyFor(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

function readRecent(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENT);
  } catch {
    return []; // storage blocked, or the contents no longer parse
  }
}

function fetchSuggestions(key: string) {
  const seq = ++requestSeq;
  controller?.abort();
  controller = new AbortController();
  set({ loading: true });

  fetch(`/api/search/suggest?q=${encodeURIComponent(key)}`, { signal: controller.signal })
    .then((response) => (response.ok ? (response.json() as Promise<Suggestions>) : null))
    .then((data) => {
      if (seq !== requestSeq) return; // a newer request has already answered
      if (!data) {
        set({ loading: false });
        return;
      }
      cache.set(key, data);
      set({ query: key, data, loading: false });
    })
    .catch(() => {
      // An abort lands here too, and its sequence is already stale, so this only fires for a
      // genuine failure. The field still submits to /search either way.
      if (seq === requestSeq) set({ loading: false });
    });
}

/** Ask for suggestions for `query`, debounced. A cached answer applies immediately. */
export function requestSuggestions(query: string) {
  const key = keyFor(query);
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  const cached = cache.get(key);
  if (cached) {
    requestSeq++; // anything in flight is now answering a question we no longer have
    controller?.abort();
    set({ query: key, data: cached, loading: false });
    return;
  }

  timer = setTimeout(() => {
    timer = null;
    fetchSuggestions(key);
  }, DEBOUNCE_MS);
}

/** Warms the no-query payload, so the panel is filled before the first keystroke. */
export function prefetchSuggestions() {
  if (cache.has("") || snapshot.loading) return;
  fetchSuggestions("");
}

/** Records a submitted query. Newest first, no duplicates, six kept. */
export function rememberSearch(query: string) {
  const value = query.trim().replace(/\s+/g, " ");
  if (!value) return;
  const next = [value, ...snapshot.recent.filter((q) => q.toLowerCase() !== value.toLowerCase())].slice(
    0,
    MAX_RECENT,
  );
  set({ recent: next });
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: recent searches are a convenience, not the feature
  }
}

export function openSearchSheet(seed = "") {
  set({ sheetOpen: true, sheetSeed: seed });
}

export function closeSearchSheet() {
  set({ sheetOpen: false, sheetSeed: "" });
}

function subscribe(listener: () => void): () => void {
  // First subscribe happens after mount, so this is the earliest safe read.
  if (!loaded) {
    loaded = true;
    snapshot = { ...snapshot, recent: readRecent() };
  }
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    set({ recent: readRecent() });
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSearchSuggestions(): SearchSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}
