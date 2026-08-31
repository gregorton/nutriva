import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { profileFor } from "@/lib/profile";
import { Panel } from "@/components/account/account-panels";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = { title: "Profile" };

/*
  The account's own details. `profileFor` is the one read in this codebase that hands an email
  address to a component, and this is the page it exists for — everything else goes through
  lib/dal.ts, which returns an id and a display name and nothing else.
*/
export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  const profile = await profileFor(user.id);

  if (!profile) {
    return (
      <Panel title="Profile">
        <p className="text-sm text-muted">That account no longer exists.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Profile" meta="Only you can see this">
      <ProfileForm profile={profile} />
    </Panel>
  );
}
