import { StorefrontShell } from "@/components/chrome/storefront-shell";

/*
  Every route that is the shop: `/`, `/c/[slug]`, `/p/[slug]`, `/search`, `/deals`, `/starters`,
  `/guides`, `/equipment`, `/help/contact`, `/signin`, `/signup` and `/account/*`.

  The group's brackets keep the folder out of the URL, so nothing here changed a path — this exists
  only so that /admin, which sits outside the group, can render without the chrome.
*/
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
