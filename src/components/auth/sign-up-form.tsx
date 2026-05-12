"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { signUpAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";
import { SubmitCooldownButton } from "@/components/ui/submit-cooldown-button";

const authCardClass =
  "rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.45)] sm:p-7";

function PasswordInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="space-y-1 text-sm text-zinc-700">
      <span>
        {label}
        <RequiredMark />
      </span>
      <div className="relative">
        <Input
          name={name}
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          value={value}
          autoComplete="new-password"
          onChange={(event) => onChange(event.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md px-1 text-zinc-500 hover:text-zinc-800"
          aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

export function SignUpForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <form action={signUpAction} className={`${authCardClass} space-y-4`}>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Sign Up</p>
        <p className="text-sm text-zinc-700">Create your account to start listing.</p>
      </div>

      <label className="space-y-1 text-sm text-zinc-700">
        <span>
          Full Name
          <RequiredMark />
        </span>
        <Input name="fullName" type="text" required autoComplete="name" />
      </label>
      <label className="space-y-1 text-sm text-zinc-700">
        <span>
          Email
          <RequiredMark />
        </span>
        <Input name="email" type="email" required autoComplete="email" />
      </label>

      <PasswordInput label="Password" name="password" value={password} onChange={setPassword} />
      <p className="text-xs text-zinc-500">Use at least 8 characters.</p>
      <PasswordInput
        label="Confirm Password"
        name="confirmPassword"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />

      {passwordsMismatch ? <p className="text-xs text-red-600">Passwords do not match</p> : null}

      <SubmitCooldownButton className="mt-2 w-full" disabled={passwordsMismatch}>
        Create Account
      </SubmitCooldownButton>

      <p className="text-center text-xs leading-5 text-zinc-500">
        By clicking Create Account, you agree with RentItOut&apos;s{" "}
        <Link href="/privacy-policy" className="font-medium text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/terms-and-conditions"
          className="font-medium text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline"
        >
          Terms and Conditions
        </Link>
        .
      </p>
    </form>
  );
}
