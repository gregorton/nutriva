/*
  The session cookie's name, alone in a file with no imports.

  `proxy.ts` needs this string and nothing else from the session layer. It sits here rather than in
  `lib/session.ts` because Next traces a proxy's whole import graph into the proxy bundle, and
  Netlify runs that bundle as a Deno edge function: importing `lib/session.ts` pulled in `lib/db.ts`
  and so `pg`, which Next treats as an external package and emits as a runtime dynamic import that
  Deno cannot resolve. The bundle then loads with an uncallable export, and every path the proxy
  matcher covers — /account and everything under it — answers 500 with "nextHandler is not a
  function". Nothing about it fails locally, because `next dev` and `next start` resolve the import.

  So the rule for anything `proxy.ts` reaches: no database, no `server-only`, no Node built-ins.
*/
export const SESSION_COOKIE = "swa.session";
