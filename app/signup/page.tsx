import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/dal";
import { AuthPanel } from "@/components/account/auth-panel";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Nutriva account to write reviews and save products.",
};

function localPath(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && /^\/(?![/\\])/.test(next) ? next : "/account";
}

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  const target = localPath(next);

  if (await getUser()) redirect(target);

  return <AuthPanel mode="signup" next={target} />;
}
