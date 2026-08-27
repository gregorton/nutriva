import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser } from "@/lib/dal";
import { AuthForm } from "@/components/account/auth-form";

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

  return (
    <div className="shell flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-[420px]">
        <h1 className="text-[26px] leading-tight">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          Email and a password. We do not send marketing and there is nothing else to fill in.
        </p>

        <div className="mt-6 rounded-tile border border-line bg-paper p-6">
          <AuthForm mode="signup" next={target} />
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          Already have one?{" "}
          <Link
            href={`/signin?next=${encodeURIComponent(target)}`}
            className="font-medium text-plum-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
