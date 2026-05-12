import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo";

interface SignInPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = buildPageMetadata({
  title: "Sign In",
  description: "Sign in to manage your listings, profile, and rental communication settings.",
  path: "/auth/sign-in",
  noIndex: true,
});

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";
  const message = typeof query.message === "string" ? query.message : "";
  const next = typeof query.next === "string" ? query.next : "/my-account";
  const otpEmail = typeof query.otpEmail === "string" ? query.otpEmail : "";
  const resetEmail = typeof query.resetEmail === "string" ? query.resetEmail : "";

  const user = await getCurrentUser();

  if (user) {
    redirect("/my-account");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg min-w-0 flex-col gap-5 px-4 py-8 sm:gap-6 sm:py-12">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">RentItOut</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">Sign In</h1>
        <p className="text-sm text-zinc-600">Use your email and password to continue.</p>
      </div>

      {message ? <Alert message={message} type="success" /> : null}
      {error ? <Alert message={error} type="error" /> : null}

      <SignInForm next={next} otpEmail={otpEmail} resetEmail={resetEmail} />

      <p className="text-center text-sm text-zinc-600">
        New here?{" "}
        <Link href="/auth/sign-up" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
          Create a new account
        </Link>
      </p>

      <p className="text-center text-xs leading-6 text-zinc-500">
        <Link href="/privacy-policy" className="underline-offset-4 hover:underline">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms-and-conditions" className="underline-offset-4 hover:underline">
          T&amp;C
        </Link>
      </p>
    </div>
  );
}
