/*
  Recently viewed products, in localStorage.

  The cart's contract applied to browsing history: an external store read through
  useSyncExternalStore, with an empty server snapshot, so the 470 prerendered product pages render
  the same on the server as they do on the first client pass. Never useState plus an effect.

  It is a list of slugs and nothing else — no timestamps, no counts, nothing that would make this a
  behavioural log. Twelve entries, most recent first, and it never leaves the browser: the privacy
  page says so, and this file is what that sentence rests on.
*/

const STORAGE_KEY = "swa.viewed.v1";
const LIMIT = 12;

const EMPTY: string[] = [];
let snapshot: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : EMPTY;
  } catch {
    return EMPTY; // storage blocked, or contents no longer parse
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToViewed(listener: () => void): () => void {
  if (!loaded) {
    loaded = true;
    snapshot = read();
  }
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = read();
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function viewedSnapshot(): string[] {
  return snapshot;
}

export function viewedServerSnapshot(): string[] {
  return EMPTY;
}

/** Moves a slug to the front, trimming to the cap. A repeat visit reorders rather than duplicating. */
export function recordViewed(slug: string): void {
  if (!loaded) {
    loaded = true;
    snapshot = read();
  }
  if (snapshot[0] === slug) return;

  const next = [slug, ...snapshot.filter((entry) => entry !== slug)].slice(0, LIMIT);
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: the rail simply stays as it was
  }
  emit();
}
