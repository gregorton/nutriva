import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/*
  Proxy — what Next 16 renamed middleware to.

  This is an optimistic check and nothing more: it looks at whether a session cookie is present,
  not whether it resolves to a live session. That is deliberate, because this runs ahead of every
  matched request including prefetches, and a database round trip here would put one on the path
  of every navigation.

  The real check is `requireUser()` in lib/dal.ts, which every page under /account calls. This
  only saves a stranger with no cookie at all from rendering a page that would redirect anyway.
*/
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const signin = new URL("/signin", request.url);
  signin.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(signin);
}

export const config = {
  matcher: ["/account", "/account/:path*"],
};
