import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { recentAccounts } from "@/lib/admin-stats";
import { Pager } from "@/components/admin/pager";
import { RankTable } from "@/components/admin/rank-table";
import { When } from "@/components/admin/when";
import { reviewCount } from "@/lib/format";

export const metadata: Metadata = { title: "Accounts" };

/*
  Every account, newest first.

  This is the one surface on the site that displays an email address — the reason lib/admin.ts keeps
  the gate to an allowlist and answers a stranger with a 404 rather than a 403.
*/
export default async function AdminAccountsPage({ searchParams }: PageProps<"/admin/accounts">) {
  await requireAdmin("/admin/accounts");

  const { before } = await searchParams;
  const cursor = typeof before === "string" ? before : null;
  const page = await recentAccounts(cursor);

  return (
    <section>
      <RankTable
        caption={`accounts · newest first${cursor ? " · older page" : ""}`}
        columns={["Name", "Email", "Joined", "Sign-in", "Reviews", "Saved"]}
        numericFrom={4}
        rows={page.rows.map((account) => ({
          key: account.id,
          cells: [
            account.displayName,
            account.email ?? "—",
            <When key="when" iso={account.createdAt} />,
            [account.hasPassword ? "password" : null, ...account.providers].filter(Boolean).join(" + ") ||
              "—",
            reviewCount(account.reviews),
            reviewCount(account.saved),
          ],
        }))}
        empty="No accounts yet."
      />

      <Pager base="/admin/accounts" cursor={cursor} nextCursor={page.cursor} />
    </section>
  );
}
