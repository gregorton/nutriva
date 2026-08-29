"use client";

import { useEffect } from "react";

/*
  Reports one view to /api/track. Renders nothing.

  A client component because the surfaces worth counting are the prerendered ones — see the
  comment in app/api/track/route.ts. What it therefore measures is a page opened by a browser
  that runs JavaScript, once per page per JS context: not a raw hit, and not a person, since
  nothing here identifies one.
*/

// Module scope rather than a ref, because it has to survive React's development double-mount and
// a back-navigation that remounts the same page. One page opened once counts once.
const sent = new Set<string>();

export function ViewBeacon({
  kind,
  value,
}: {
  kind: "product" | "surface" | "search";
  value: string;
}) {
  useEffect(() => {
    const id = `${kind}:${value}`;
    if (sent.has(id)) return;
    sent.add(id);

    // `keepalive` so the request outlives the navigation that usually follows it. Deliberately no
    // AbortController: this is the one place in the codebase where aborting on unmount is wrong,
    // because unmount is the navigation being recorded.
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, key: value }),
      keepalive: true,
    }).catch(() => {
      // A shopper never needs to know a counter missed.
    });
  }, [kind, value]);

  return null;
}
