"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { refreshAccount } from "@/components/account/account-store";

/*
  Keeps the masthead's idea of who is signed in from going stale. Renders nothing.

  The account state is a client island (see account-store.ts for why it has to be), and the
  masthead lives in the root layout, so it survives every navigation — including the ones nobody
  asked for. Setting a cookie in a Server Action makes Next re-render the current route on the
  server, and /signin and /signup redirect once a session exists, so signing in navigates by
  itself before any client code gets a say. An island that only refreshed when a form told it to
  would sit there showing "Sign in" to somebody who had just signed in.

  So the refresh hangs off the pathname instead: whatever caused the navigation, the answer is
  re-fetched afterwards. That is one small no-store request per client-side navigation, which is
  a fraction of the RSC payload the same navigation already fetched, and it removes every way for
  the header to disagree with the session.
*/
export function SessionSync() {
  const pathname = usePathname();

  useEffect(() => {
    void refreshAccount();
  }, [pathname]);

  return null;
}
