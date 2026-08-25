/** Helpers for filter/sort state carried in the URL, so listing pages stay shareable. */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function toParams(raw: RawSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value !== undefined) params.set(key, value);
  }
  return params;
}

export function values(raw: RawSearchParams, key: string): string[] {
  const value = raw[key];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

/** Returns the href for a page with `value` added to or removed from `key`. */
export function toggleHref(base: string, raw: RawSearchParams, key: string, value: string): string {
  const params = toParams(raw);
  const current = params.getAll(key);
  params.delete(key);
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  next.forEach((v) => params.append(key, v));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** Returns the href for a page with `key` set to a single value (or cleared). */
export function setHref(base: string, raw: RawSearchParams, key: string, value: string | null): string {
  const params = toParams(raw);
  if (value === null) params.delete(key);
  else params.set(key, value);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
