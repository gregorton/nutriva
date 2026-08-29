import { getUser } from "@/lib/dal";
import { savedSlugs } from "@/lib/saved";

/*
  Who is signed in, and what they have saved.

  The only route handler that reads a session — `app/api/search/suggest/route.ts` is the other one,
  and it reads nothing per-visitor. Everything else that touches the database is a Server Action or
  a server component. This one exists because the masthead lives in the root layout: a
  server component there awaiting cookies() would make every route in the app dynamic and cost
  all 470 product pages their prerender. So the account state is a client island that asks here
  after mount, the same shape as the cart reading localStorage.

  It returns a display name and a list of slugs. Nothing else about the account is exposed.
*/
export async function GET() {
  const user = await getUser();

  return Response.json(
    { user, saved: user ? await savedSlugs(user.id) : [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
