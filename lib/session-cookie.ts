/*
  The session cookie's name, alone in a file with no imports.

  `proxy.ts` needs this string and nothing else from the session layer. It sits here rather than in
  `lib/session.ts` because Next traces a proxy's whole import graph into the proxy bundle, and that
  bundle runs on a stripped-down runtime: importing `lib/session.ts` pulled in `lib/db.ts` and so
  `pg`, which Next treats as an external package and emits as a runtime dynamic import the proxy
  runtime cannot resolve. The bundle then loaded with an uncallable export, and every path the proxy
  matcher covers — /account and everything under it — answered 500 with "nextHandler is not a
  function". Nothing about it failed locally, because `next dev` and `next start` resolve the import.

  The deployment has changed since (Cloudflare Workers, where OpenNext bundles the proxy separately
  and calls Node-runtime middleware support experimental), and the rule is unchanged for the same
  reason: anything `proxy.ts` reaches must carry no database, no `server-only`, no Node built-ins.
*/
export const SESSION_COOKIE = "swa.session";
