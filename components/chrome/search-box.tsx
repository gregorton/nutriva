"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  closeSearchSheet,
  openSearchSheet,
  prefetchSuggestions,
  rememberSearch,
  requestSuggestions,
  useSearchSuggestions,
  type SearchSnapshot,
} from "@/components/chrome/search-store";
import { ChevronRightIcon, ClockIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";
import { price } from "@/lib/format";
import type { SuggestProduct } from "@/lib/search-suggest";

/*
  The masthead search field, in three placements that share one store.

  `SearchField` is the inline field from `sm` up with a panel anchored under it; `SearchRow` is the
  phone row below the masthead; `SearchTrigger` is the phone icon that stands in for that row once
  the chrome pins. Below `sm` both the row and the icon open `SearchSheet`, a full-screen overlay —
  a dropdown there would have to fight the 103px pinned chrome and the on-screen keyboard at once,
  and every phone shopper already knows the sheet.

  Each placement stays a real GET form around a real input, so before hydration and with JS off the
  field still submits to /search. The panel is an enhancement, never the mechanism.

  One flat `rows` array carries every section in display order. Arrow keys, `aria-activedescendant`,
  Enter and the live-region count all read that array, so none of the keyboard or ARIA logic knows
  how many sections exist — adding or dropping one is a data change, not a logic change.
*/

type RowKind = "recent" | "popular" | "term" | "category" | "did-you-mean" | "product" | "all";

type Row = {
  id: string;
  kind: RowKind;
  href: string;
  label: string;
  note: string | null;
  count: number | null;
  product: SuggestProduct | null;
};

/** A labelled run of rows. `grid` is the one layout difference: products go two-up on a wide panel. */
type Section = { key: string; heading: string | null; grid: boolean; rows: Row[] };

const PLACEHOLDER_SHORT = "Search supplements";

function buildSections(snapshot: SearchSnapshot, query: string, prefix: string): Section[] {
  const sections: Section[] = [];
  let index = 0;

  const push = (
    key: string,
    heading: string | null,
    grid: boolean,
    source: { label: string; href: string; note?: string | null; count?: number | null }[],
    kind: RowKind,
    products?: SuggestProduct[],
  ) => {
    if (source.length === 0) return;
    sections.push({
      key,
      heading,
      grid,
      rows: source.map((item, offset) => ({
        id: `${prefix}-row-${index++}`,
        kind,
        href: item.href,
        label: item.label,
        note: item.note ?? null,
        count: item.count ?? null,
        product: products?.[offset] ?? null,
      })),
    });
  };

  const data = snapshot.data;

  // Before a keystroke: what this visitor searched for, then what the shop is known for.
  if (!query.trim()) {
    push(
      "recent",
      "Recent searches",
      false,
      snapshot.recent.map((value) => ({ label: value, href: `/search?q=${encodeURIComponent(value)}` })),
      "recent",
    );
    push("popular", "Popular searches", false, data?.popular ?? [], "popular");
    return sections;
  }

  // `data` may still be answering the previous keystroke; showing it beats flashing empty.
  if (!data || !data.query) return sections;

  if (data.didYouMean) {
    push("did-you-mean", null, false, [{ ...data.didYouMean, label: data.didYouMean.label }], "did-you-mean");
  }
  push("categories", "Categories", false, data.categories, "category");
  push("terms", "Refine", false, data.terms, "term");
  push(
    "products",
    "Products",
    true,
    data.products.map((product) => ({
      label: product.title,
      href: `/p/${product.slug}`,
      note: product.brand,
      count: null,
    })),
    "product",
    data.products,
  );
  if (data.total > data.products.length) {
    push(
      "all",
      null,
      false,
      [
        {
          label: `See all ${data.total} results for “${data.query}”`,
          href: `/search?q=${encodeURIComponent(data.query)}`,
        },
      ],
      "all",
    );
  }

  return sections;
}

type ComboboxOptions = {
  /** Unique per placement: two placements can sit in the DOM at once, and `role="option"` ids
   *  referenced by `aria-activedescendant` must not collide. */
  prefix: string;
  initialValue?: string;
  /** The sheet's panel is open for as long as the sheet is; the anchored panel opens on use. */
  alwaysOpen?: boolean;
  onDismiss?: () => void;
  /** The element an outside press closes the panel from. Owned by the placement rather than
   *  returned from here: a hook that hands a ref back taints every other value it returns for
   *  `react-hooks/refs`, which then reads each `combo.rows` in the markup as a ref access. */
  outside?: RefObject<HTMLDivElement | null>;
};

function useCombobox({ prefix, initialValue = "", alwaysOpen = false, onDismiss, outside }: ComboboxOptions) {
  const snapshot = useSearchSuggestions();
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(alwaysOpen);
  const [activeIndex, setActiveIndex] = useState(-1);

  const sections = buildSections(snapshot, value, prefix);
  const rows = sections.flatMap((section) => section.rows);
  const expanded = (alwaysOpen || open) && rows.length > 0;
  // A debounced answer can arrive with fewer rows than the one the cursor was walking.
  const index = expanded && activeIndex >= 0 ? Math.min(activeIndex, rows.length - 1) : -1;
  const active = index >= 0 ? rows[index] : null;

  const dismiss = () => {
    setActiveIndex(-1);
    if (alwaysOpen) onDismiss?.();
    else setOpen(false);
  };

  const follow = (row: Row) => {
    dismiss();
    router.push(row.href);
  };

  const change = (next: string) => {
    setValue(next);
    setActiveIndex(-1);
    if (!alwaysOpen) setOpen(true);
    requestSuggestions(next);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!expanded) {
        setOpen(true);
        requestSuggestions(value);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      // Wraps both ways, so neither end of the list is a dead press.
      setActiveIndex(index < 0 ? (step === 1 ? 0 : rows.length - 1) : (index + step + rows.length) % rows.length);
      return;
    }
    if (expanded && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : rows.length - 1);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (alwaysOpen) {
        onDismiss?.();
        return;
      }
      // First press puts the panel away and leaves focus in the field; a second clears it.
      if (open) {
        setOpen(false);
        setActiveIndex(-1);
        return;
      }
      if (value) change("");
      return;
    }
    if (event.key === "Tab") dismiss();
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (active) {
      follow(active);
      return;
    }
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!trimmed) return;
    rememberSearch(trimmed);
    dismiss();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const onFocus = () => {
    prefetchSuggestions();
    if (!alwaysOpen) setOpen(true);
    if (value.trim()) requestSuggestions(value);
  };

  /*
    Outside-click, registered only while the panel is open and torn down when it closes — the shape
    `components/account/account-button.tsx` uses. It lives in the hook rather than in each placement
    so it can call the state setters directly: they are stable, so the effect's dependencies are
    honest and it does not re-register on every render.
  */
  useEffect(() => {
    if (alwaysOpen || !expanded || !outside) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!outside.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [alwaysOpen, expanded, outside]);

  return {
    value,
    setValue,
    sections,
    rows,
    expanded,
    activeId: active?.id,
    activeIndex: index,
    setActiveIndex,
    dismiss,
    follow,
    change,
    onKeyDown,
    onSubmit,
    onFocus,
    loading: snapshot.loading,
  };
}

/** The ARIA plumbing every placement's input carries, so no placement can forget half of it. */
function comboboxProps(listboxId: string, expanded: boolean, activeId: string | undefined) {
  return {
    type: "search" as const,
    name: "q",
    role: "combobox" as const,
    "aria-expanded": expanded,
    "aria-controls": listboxId,
    "aria-autocomplete": "list" as const,
    "aria-activedescendant": activeId,
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
    inputMode: "search" as const,
    enterKeyHint: "search" as const,
  };
}

/** The count on a row is the size of the page it opens, so it reads as a promise, not a score. */
function RowCount({ count }: { count: number | null }) {
  if (count === null) return null;
  return <span className="facts shrink-0 text-faint">{count}</span>;
}

function RowIcon({ kind }: { kind: RowKind }) {
  const className = "h-4 w-4 shrink-0 text-faint";
  if (kind === "recent") return <ClockIcon className={className} />;
  if (kind === "category" || kind === "all") return <ChevronRightIcon className={className} />;
  return <SearchIcon className={className} />;
}

type RowProps = {
  row: Row;
  index: number;
  active: boolean;
  onHover: (index: number) => void;
  onSelect: () => void;
};

const ROW_BASE =
  "flex items-center gap-3 px-4 py-2.5 text-left text-[14px] text-ink no-underline transition-colors";

function TextRow({ row, index, active, onHover, onSelect }: RowProps) {
  return (
    <Link
      href={row.href}
      id={row.id}
      role="option"
      aria-selected={active}
      tabIndex={-1}
      onPointerEnter={() => onHover(index)}
      onClick={onSelect}
      className={`${ROW_BASE} ${active ? "bg-plum-100" : "hover:bg-paper"}`}
    >
      <RowIcon kind={row.kind} />
      <span className="min-w-0 flex-1">
        {row.kind === "did-you-mean" ? (
          <>
            Did you mean <span className="font-semibold text-plum-800">{row.label}</span>?
          </>
        ) : (
          <span className="block truncate">{row.label}</span>
        )}
        {row.note ? <span className="mt-0.5 block truncate text-[12px] text-muted">{row.note}</span> : null}
      </span>
      <RowCount count={row.count} />
    </Link>
  );
}

function ProductRow({ row, index, active, onHover, onSelect }: RowProps) {
  const product = row.product;
  if (!product) return null;
  return (
    <Link
      href={row.href}
      id={row.id}
      role="option"
      aria-selected={active}
      tabIndex={-1}
      onPointerEnter={() => onHover(index)}
      onClick={onSelect}
      className={`${ROW_BASE} ${active ? "bg-plum-100" : "hover:bg-paper"}`}
    >
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded border border-line bg-white">
        <Image src={product.image} alt="" fill sizes="44px" className="object-contain p-0.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{product.title}</span>
        <span className="mt-0.5 block truncate text-[12px] text-muted">{product.brand}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className={`block text-[14px] font-semibold ${product.discount ? "text-sale-600" : "text-ink"}`}>
          {price(product.price)}
        </span>
        {product.listPrice ? (
          <span className="facts block text-faint line-through">{price(product.listPrice)}</span>
        ) : null}
      </span>
    </Link>
  );
}

type PanelProps = {
  listboxId: string;
  sections: Section[];
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: () => void;
};

/*
  The listbox. Sections are `role="group"` so the listbox's children stay options and groups, and the
  visible heading is `aria-hidden` with the same words on the group's `aria-label` — a heading is not
  a legal listbox child, and the label says the same thing to a screen reader.
*/
function Panel({ listboxId, sections, activeIndex, onHover, onSelect }: PanelProps) {
  let index = 0;
  return (
    <div id={listboxId} role="listbox" aria-label="Search suggestions" className="py-1">
      {sections.map((section) => (
        <div key={section.key} role="group" aria-label={section.heading ?? undefined} className="py-1">
          {section.heading ? (
            <p className="kicker px-4 pb-1 pt-1 text-plum-700" aria-hidden>
              {section.heading}
            </p>
          ) : null}
          <div className={section.grid ? "lg:grid lg:grid-cols-2" : undefined}>
            {section.rows.map((row) => {
              const at = index++;
              const props = { row, index: at, active: at === activeIndex, onHover, onSelect };
              return row.kind === "product" ? (
                <ProductRow key={row.id} {...props} />
              ) : (
                <TextRow key={row.id} {...props} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Politely announced, and only the count: reading 20 rows aloud on every keystroke is worse than
 *  silence, and the rows themselves are reachable with the arrow keys. */
function LiveCount({ rows, query }: { rows: number; query: string }) {
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {query.trim() ? (rows > 0 ? `${rows} suggestions` : "No suggestions") : ""}
    </p>
  );
}

const PANEL_SHELL =
  "absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-card border border-line bg-white shadow-[0_18px_40px_-24px_rgba(43,15,32,0.6)]";

/**
 * The inline field, `sm` and up. Its panel is absolutely positioned under the field at `z-50`, above
 * the pinned chrome's `z-40` and the category panel's, and it is **unmounted when closed** rather
 * than hidden: `components/ui/hint.tsx` records what an invisible-but-laid-out panel did to
 * `documentElement.scrollWidth` on a narrow viewport, and two assertion scripts now check for it.
 */
export function SearchField({ placeholder }: { placeholder: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const combo = useCombobox({ prefix: "search-field", outside: wrapper });
  const listboxId = "search-field-listbox";

  return (
    <div
      ref={wrapper}
      className="relative hidden max-w-2xl flex-1 sm:block"
      onPointerEnter={prefetchSuggestions}
    >
      <form action="/search" role="search" onSubmit={combo.onSubmit}>
        <label htmlFor="site-search" className="sr-only">
          Search supplements
        </label>
        <input
          id="site-search"
          {...comboboxProps(listboxId, combo.expanded, combo.activeId)}
          value={combo.value}
          onChange={(event) => combo.change(event.target.value)}
          onKeyDown={combo.onKeyDown}
          onFocus={combo.onFocus}
          placeholder={placeholder}
          className="h-11 w-full rounded-card border border-line-strong bg-paper pl-4 pr-12 text-[15px] text-ink placeholder:text-faint focus:border-plum-600 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1 flex h-9 w-10 items-center justify-center rounded-[7px] text-plum-700 transition-colors hover:bg-plum-100"
        >
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>
      </form>

      {combo.expanded ? (
        <div className={PANEL_SHELL}>
          <Panel
            listboxId={listboxId}
            sections={combo.sections}
            activeIndex={combo.activeIndex}
            onHover={combo.setActiveIndex}
            onSelect={combo.dismiss}
          />
        </div>
      ) : (
        // The listbox has to exist for `aria-controls` to point at something even while closed.
        <div id={listboxId} role="listbox" aria-label="Search suggestions" hidden />
      )}
      <LiveCount rows={combo.rows.length} query={combo.value} />
    </div>
  );
}

/**
 * The phone row under the masthead. Still a real GET form — before hydration, and with JS off, it is
 * the whole search feature — but a press on the field hands over to the sheet, seeded with whatever
 * is already typed. A dropdown here would have to share the screen with the on-screen keyboard.
 */
export function SearchRow() {
  const [value, setValue] = useState("");
  const open = () => openSearchSheet(value);

  return (
    <form action="/search" className="shell pb-3 sm:hidden group-data-[stuck=true]/chrome:hidden" role="search">
      <label htmlFor="site-search-mobile" className="sr-only">
        Search supplements
      </label>
      <div className="relative">
        <input
          id="site-search-mobile"
          name="q"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={open}
          onPointerDown={prefetchSuggestions}
          placeholder={PLACEHOLDER_SHORT}
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
          className="h-10 w-full rounded-card border border-line-strong bg-paper pl-3 pr-10 text-[15px] placeholder:text-faint focus:border-plum-600 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-[7px] text-plum-700"
        >
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </form>
  );
}

/**
 * The phone icon beside the cart, and the sheet's one mount point. It has to own the sheet rather
 * than `SearchRow`: the row folds away when the chrome pins, and a sheet mounted inside it would be
 * unmounted mid-search by a scroll.
 */
export function SearchTrigger() {
  const { sheetOpen, sheetSeed } = useSearchSuggestions();

  return (
    <>
      {/* Still a link to /search, and still the real destination with JS off — the press is
          intercepted to open the sheet instead, which is the enhancement. */}
      <Link
        href="/search"
        aria-label="Search supplements"
        onPointerEnter={prefetchSuggestions}
        onClick={(event) => {
          event.preventDefault();
          openSearchSheet();
        }}
        className="flex h-10 w-10 items-center justify-center rounded-card text-plum-700 transition-colors hover:bg-plum-100 sm:hidden"
      >
        <SearchIcon className="h-[19px] w-[19px]" />
      </Link>
      {sheetOpen ? <SearchSheet seed={sheetSeed} /> : null}
    </>
  );
}

/**
 * The phone sheet: a full-screen overlay, input pinned at the top with Cancel, suggestions filling
 * the rest. `position: fixed` escapes the sticky chrome only while no ancestor creates a containing
 * block, so nothing on `StickyChrome`, `SiteHeader` or this subtree may carry `transform`, `filter`
 * or `will-change` — the same rule `pdp/zoom-shot.tsx` lives under. `100dvh` keeps the iOS URL bar
 * from cropping the last row, and the input is 16px so iOS does not zoom the page on focus.
 */
function SearchSheet({ seed }: { seed: string }) {
  const combo = useCombobox({
    prefix: "search-sheet",
    initialValue: seed,
    alwaysOpen: true,
    onDismiss: closeSearchSheet,
  });
  const listboxId = "search-sheet-listbox";
  const input = useRef<HTMLInputElement>(null);

  // Scroll lock with restore, and Escape from anywhere in the sheet — `cart-drawer.tsx`'s shape,
  // the codebase's only other overlay.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    prefetchSuggestions();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSearchSheet();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Whatever the phone row already held is a query the visitor typed; answer it without a keystroke.
  useEffect(() => {
    if (seed.trim()) requestSuggestions(seed);
  }, [seed]);

  return (
    <div id="search-sheet" className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <form action="/search" role="search" className="relative flex-1" onSubmit={combo.onSubmit}>
          <label htmlFor="site-search-sheet" className="sr-only">
            Search supplements
          </label>
          <input
            ref={input}
            id="site-search-sheet"
            {...comboboxProps(listboxId, combo.expanded, combo.activeId)}
            value={combo.value}
            onChange={(event) => combo.change(event.target.value)}
            onKeyDown={combo.onKeyDown}
            placeholder={PLACEHOLDER_SHORT}
            className="h-10 w-full rounded-card border border-line-strong bg-paper pl-3 pr-9 text-[16px] text-ink placeholder:text-faint focus:border-plum-600 focus:bg-white focus:outline-none"
          />
          {combo.value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                combo.change("");
                input.current?.focus();
              }}
              className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-[7px] text-muted"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </form>
        <button
          type="button"
          onClick={closeSearchSheet}
          className="shrink-0 px-1 text-[14px] font-medium text-plum-700"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <Panel
          listboxId={listboxId}
          sections={combo.sections}
          activeIndex={combo.activeIndex}
          onHover={combo.setActiveIndex}
          onSelect={closeSearchSheet}
        />
      </div>
      <LiveCount rows={combo.rows.length} query={combo.value} />
    </div>
  );
}
