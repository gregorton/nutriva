"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { refreshAccount, useAccount } from "@/components/account/account-store";
import { ChevronIcon, ExitIcon, HeartIcon, StarIcon, UserIcon } from "@/components/ui/icons";

/*
  The masthead's account control — "Sign in" to a stranger, a name and a menu to anyone signed in.

  Replaces the static /account link the header used to carry. It is a client component so the
  root layout stays static; see components/account/account-store.ts for why that matters.

  It shows at every width. Below `sm` the wording drops and the mark stands alone beside the
  search and cart icons, because hiding the control entirely there left a phone with no route
  into an account at all: no sign-in, no saved items, no way back out.
*/
export function AccountButton() {
  const { user, loaded } = useAccount();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const wrapper = useRef<HTMLDivElement>(null);

  // A menu that stays open behind a click elsewhere reads as stuck rather than open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Until the first /api/session response lands this renders exactly what the server sent, so
  // there is nothing to hydrate around and no flicker between two states.
  if (!loaded || !user) {
    return (
      <Link
        href="/signin"
        aria-label="Sign in"
        className="flex h-10 items-center gap-2 rounded-card px-2 text-sm font-medium text-ink transition-colors hover:bg-paper sm:px-3 sm:py-2"
      >
        <UserIcon className="h-[19px] w-[19px] text-plum-700 sm:h-[18px] sm:w-[18px]" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${user.displayName}`}
        className="flex h-10 max-w-[190px] items-center gap-2 rounded-card px-2 text-sm font-medium text-ink transition-colors hover:bg-paper sm:px-3 sm:py-2"
      >
        <UserIcon className="h-[19px] w-[19px] shrink-0 text-plum-700 sm:h-[18px] sm:w-[18px]" />
        <span className="hidden truncate sm:inline">{user.displayName}</span>
        <ChevronIcon
          className={`hidden h-3.5 w-3.5 shrink-0 text-muted transition-transform sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-card border border-line bg-white py-1 shadow-[0_18px_40px_-24px_rgba(43,15,32,0.6)]"
        >
          <MenuLink href="/account" onNavigate={() => setOpen(false)}>
            <UserIcon className="h-4 w-4 text-plum-700" />
            Your account
          </MenuLink>
          <MenuLink href="/account/saved" onNavigate={() => setOpen(false)}>
            <HeartIcon className="h-4 w-4 text-plum-700" />
            Saved items
          </MenuLink>
          <MenuLink href="/account/reviews" onNavigate={() => setOpen(false)}>
            <StarIcon className="h-4 w-4 text-star" />
            Your reviews
          </MenuLink>

          <div className="my-1 border-t border-line" />

          <button
            type="button"
            disabled={pending}
            role="menuitem"
            onClick={() =>
              startTransition(async () => {
                await signOut();
                // Refresh before navigating: the header outlives the navigation, so the store is
                // what has to change for it to stop showing a name.
                await refreshAccount();
                setOpen(false);
                router.push("/");
              })
            }
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-ink transition-colors hover:bg-paper disabled:opacity-60"
          >
            <ExitIcon className="h-4 w-4 text-muted" />
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink transition-colors hover:bg-paper"
    >
      {children}
    </Link>
  );
}
