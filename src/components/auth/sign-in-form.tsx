"use client";

import { useState } from "react";
import {
  requestOtpAction,
  requestPasswordResetOtpAction,
  resetPasswordWithOtpAction,
  signInAction,
  verifyOtpAction,
} from "@/app/actions";
import { Input } from "@/components/ui/input";
import { RequiredMark } from "@/components/ui/required-mark";
import { SubmitCooldownButton } from "@/components/ui/submit-cooldown-button";

type SignInMode = "password" | "otp" | "passwordReset";

const authCardClass =
  "rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.45)] sm:p-8";

interface SignInFormProps {
  next: string;
  otpEmail: string;
  resetEmail: string;
}

export function SignInForm({ next, otpEmail, resetEmail }: SignInFormProps) {
  const normalizedOtpEmail = otpEmail.trim();
  const normalizedResetEmail = resetEmail.trim();
  const hasRequestedOtp = normalizedOtpEmail.length > 0;
  const hasRequestedPasswordResetOtp = normalizedResetEmail.length > 0;
  const [mode, setMode] = useState<SignInMode>(
    hasRequestedPasswordResetOtp ? "passwordReset" : hasRequestedOtp ? "otp" : "password",
  );

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
                <SubmitCooldownButton className="mt-2 w-full">
                  Verify OTP
                </SubmitCooldownButton>
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
              <SubmitCooldownButton className="mt-2 w-full">
                Send OTP
              </SubmitCooldownButton>
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

  if (mode === "passwordReset") {
    return (
      <>
        <div className={authCardClass}>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Forgot Password</p>
            <p className="text-sm text-zinc-700">Reset password using OTP sent to your email.</p>
          </div>

          {hasRequestedPasswordResetOtp ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-relaxed text-zinc-700">
                OTP was sent to <span className="font-medium text-zinc-900">{normalizedResetEmail}</span>. Enter OTP
                and choose a new password.
              </p>

              <form action={resetPasswordWithOtpAction} className="space-y-4">
                <input type="hidden" name="email" value={normalizedResetEmail} />
                <input type="hidden" name="next" value={next} />
                <label className="space-y-1 text-sm text-zinc-700">
                  <span>
                    Enter OTP
                    <RequiredMark />
                  </span>
                  <Input name="otp" type="text" required inputMode="numeric" placeholder="6-digit OTP" />
                </label>
                <label className="space-y-1 text-sm text-zinc-700">
                  <span>
                    New Password
                    <RequiredMark />
                  </span>
                  <Input name="newPassword" type="password" required autoComplete="new-password" />
                </label>
                <label className="space-y-1 text-sm text-zinc-700">
                  <span>
                    Confirm New Password
                    <RequiredMark />
                  </span>
                  <Input name="confirmNewPassword" type="password" required autoComplete="new-password" />
                </label>
                <SubmitCooldownButton className="mt-2 w-full">
                  Reset Password
                </SubmitCooldownButton>
              </form>

              <form action={requestPasswordResetOtpAction} className="pt-1">
                <input type="hidden" name="email" value={normalizedResetEmail} />
                <input type="hidden" name="next" value={next} />
                <SubmitCooldownButton className="w-full" variant="secondary">
                  Resend Reset OTP
                </SubmitCooldownButton>
              </form>
            </div>
          ) : (
            <form action={requestPasswordResetOtpAction} className="mt-5 space-y-4">
              <input type="hidden" name="next" value={next} />
              <label className="space-y-1 text-sm text-zinc-700">
                <span>
                  Email
                  <RequiredMark />
                </span>
                <Input name="email" type="email" required autoComplete="email" />
              </label>
              <SubmitCooldownButton className="mt-2 w-full">
                Send Reset OTP
              </SubmitCooldownButton>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-zinc-600">
          Remembered your password?{" "}
          <button
            type="button"
            onClick={() => setMode("password")}
            className="font-medium text-zinc-900 underline-offset-4 hover:underline"
          >
            Back to login
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
        <SubmitCooldownButton className="mt-2 w-full">
          Sign In
        </SubmitCooldownButton>
      </form>

      <p className="text-center text-sm text-zinc-600">
        <button
          type="button"
          onClick={() => setMode("passwordReset")}
          className="font-medium text-zinc-900 underline-offset-4 hover:underline"
        >
          Forgot password?
        </button>
      </p>

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
