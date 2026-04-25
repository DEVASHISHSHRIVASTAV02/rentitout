import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth";

interface SignUpPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : "";

  const user = await getCurrentUser();
  if (user) {
    redirect("/my-account");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg min-w-0 flex-col gap-6 px-4 py-12 sm:px-0 sm:py-14">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Join RentItOut</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-950">Create Your Account</h1>
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
