"use client";

import { useState } from "react";
import { requestOtpAction, signInAction, verifyOtpAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";

type SignInMode = "password" | "otp";

const authCardClass =
  "rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.45)] sm:p-8";

interface SignInFormProps {
  next: string;
  otpEmail: string;
}

export function SignInForm({ next, otpEmail }: SignInFormProps) {
  const normalizedOtpEmail = otpEmail.trim();
  const hasRequestedOtp = normalizedOtpEmail.length > 0;
  const [mode, setMode] = useState<SignInMode>(hasRequestedOtp ? "otp" : "password");

  if (mode === "otp") {
    return (
      <>
        <div className={authCardClass}>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">OTP Sign In</p>
            <p className="text-sm text-zinc-700">Send a one-time password to your email.</p>
          </div>

          {hasRequestedOtp ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-relaxed text-zinc-700">
                OTP was sent to <span className="font-medium text-zinc-900">{normalizedOtpEmail}</span>. Enter OTP
                below and click Verify OTP to sign in.
              </p>

              <form action={verifyOtpAction} className="space-y-4">
                <input type="hidden" name="email" value={normalizedOtpEmail} />
                <input type="hidden" name="next" value={next} />
                <label className="space-y-1 text-sm text-zinc-700">
                  <span>
                    Enter OTP
                    <RequiredMark />
                  </span>
                  <Input name="otp" type="text" required inputMode="numeric" placeholder="6-digit OTP" />
                </label>
                <Button type="submit" className="mt-2 w-full">
                  Verify OTP
                </Button>
              </form>
            </div>
          ) : (
            <form action={requestOtpAction} className="mt-5 space-y-4">
              <input type="hidden" name="next" value={next} />
              <label className="space-y-1 text-sm text-zinc-700">
                <span>
                  Email
                  <RequiredMark />
                </span>
                <Input name="email" type="email" required autoComplete="email" />
              </label>
              <Button type="submit" className="mt-2 w-full">
                Send OTP
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-zinc-600">
          Prefer password login?{" "}
          <button
            type="button"
            onClick={() => setMode("password")}
            className="font-medium text-zinc-900 underline-offset-4 hover:underline"
          >
            Login with password instead
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <form action={signInAction} className={`${authCardClass} space-y-4`}>
        <input type="hidden" name="next" value={next} />
        <label className="space-y-1 text-sm text-zinc-700">
          <span>
            Email
            <RequiredMark />
          </span>
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="space-y-1 text-sm text-zinc-700">
          <span>
            Password
            <RequiredMark />
          </span>
          <Input name="password" type="password" required autoComplete="current-password" />
        </label>
        <Button type="submit" className="mt-2 w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-600">
        <button
          type="button"
          onClick={() => setMode("otp")}
          className="font-medium text-zinc-900 underline-offset-4 hover:underline"
        >
          Use OTP login instead
        </button>
      </p>
    </>
  );
}
