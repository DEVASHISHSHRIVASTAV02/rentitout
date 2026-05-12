import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo";

interface SignUpPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = buildPageMetadata({
  title: "Create Account",
  description: "Create a RentItOut account to publish listings and manage renter-owner communication.",
  path: "/auth/sign-up",
  noIndex: true,
});

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";

  const user = await getCurrentUser();
  if (user) {
    redirect("/my-account");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg min-w-0 flex-col gap-5 px-4 py-8 sm:gap-6 sm:py-12">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Join RentItOut</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">Create Your Account</h1>
        <p className="text-sm text-zinc-600">Create an account to list items and manage rentals.</p>
      </div>

      {error ? <Alert message={error} type="error" /> : null}

      <SignUpForm />

      <p className="text-center text-sm text-zinc-600">
        Already registered?{" "}
        <Link href="/auth/sign-in" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
