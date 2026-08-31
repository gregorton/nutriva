/*
  The compare selection, in localStorage.

  Third store on the same contract as the cart and recently viewed: useSyncExternalStore, empty
  server snapshot, never useState plus an effect. It holds slugs and a cap, and nothing else.

  The selection lives here rather than in the URL because it is built up while browsing, across
  navigations. The comparison itself is a URL — /compare?p=…&p=… — so a comparison can be shared,
  bookmarked and read with no JavaScript at all. The tray is the bridge between the two.
*/

const STORAGE_KEY = "swa.compare.v1";

/** Four columns is what fits on a laptop without the table scrolling sideways. */
export const COMPARE_LIMIT = 4;

const EMPTY: string[] = [];
let snapshot: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed)
      ? parsed.filter((entry) => typeof entry === "string").slice(0, COMPARE_LIMIT)
      : EMPTY;
  } catch {
    return EMPTY; // storage blocked, or contents no longer parse
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  snapshot = read();
}

export function subscribeToCompare(listener: () => void): () => void {
  ensureLoaded();
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

export function compareSnapshot(): string[] {
  return snapshot;
}

export function compareServerSnapshot(): string[] {
  return EMPTY;
}

function write(next: string[]) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: the selection still works for this page
  }
  emit();
}

/** Adds or removes a slug. Returns false when the cap turned an add away. */
export function toggleCompare(slug: string): boolean {
  ensureLoaded();
  if (snapshot.includes(slug)) {
    write(snapshot.filter((entry) => entry !== slug));
    return true;
  }
  if (snapshot.length >= COMPARE_LIMIT) return false;
  write([...snapshot, slug]);
  return true;
}

export function clearCompare(): void {
  ensureLoaded();
  write([]);
}

/** /compare?p=slug&p=slug — the comparison as a shareable URL. */
export function compareHref(slugs: string[]): string {
  const params = new URLSearchParams();
  for (const slug of slugs) params.append("p", slug);
  return `/compare?${params.toString()}`;
}
