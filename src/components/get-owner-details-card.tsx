"use client";

import { useState } from "react";
import { Mail, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { RecaptchaV2Checkbox } from "@/components/recaptcha-v2-checkbox";
import { Button } from "@/components/ui/button";
import { revealContactDetails } from "@/lib/contact-gate-client";
import { type RevealedContactDetails } from "@/lib/contact-gate-types";

interface GetOwnerDetailsCardProps {
  listingId: string;
  ownerName: string | null;
}

export function GetOwnerDetailsCard({ listingId, ownerName }: GetOwnerDetailsCardProps) {
  const [isBotCheckOpen, setIsBotCheckOpen] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [botError, setBotError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [revealed, setRevealed] = useState<RevealedContactDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openBotCheck = () => {
    setIsBotCheckOpen(true);
    setBotError("");
    setHoneypot("");
    setRecaptchaToken(null);
    setRecaptchaResetSignal((value) => value + 1);
  };

  const closeBotCheck = () => {
    setIsBotCheckOpen(false);
    setBotError("");
    setHoneypot("");
    setRecaptchaToken(null);
    setRecaptchaResetSignal((value) => value + 1);
  };

  const verifyBotCheck = async () => {
    if (!recaptchaToken) {
      setBotError("Please complete captcha verification.");
      return;
    }

    setIsSubmitting(true);
    setBotError("");
    try {
      const details = await revealContactDetails({
        listingId,
        recaptchaToken,
        website: honeypot,
      });
      setRevealed(details);
      closeBotCheck();
    } catch (error) {
      setBotError(error instanceof Error ? error.message : "Verification failed.");
      setRecaptchaToken(null);
      setRecaptchaResetSignal((value) => value + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-medium text-zinc-900">Owner Details</p>
        {!revealed ? (
          <>
            <p className="text-xs text-zinc-600">Complete verification to view owner contact details.</p>
            <Button variant="secondary" onClick={openBotCheck}>
              Get Details
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm text-zinc-700">
              <UserRound className="h-4 w-4" />
              {revealed.ownerName ?? ownerName ?? "Listing Owner"}
            </p>
            <p className="flex items-center gap-2 text-sm text-zinc-700">
              <Mail className="h-4 w-4" />
              {revealed.contactEmail ?? "Not shared"}
            </p>
            <p className="flex items-center gap-2 text-sm text-zinc-700">
              <Phone className="h-4 w-4" />
              {revealed.contactPhone ?? "Not shared"}
            </p>
          </div>
        )}
      </div>

      {isBotCheckOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Verify</p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-950">Bot Check</h3>
              </div>
              <button
                type="button"
                onClick={closeBotCheck}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close bot check"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 text-sm text-zinc-700">
                <ShieldCheck className="h-4 w-4" />
                Complete reCAPTCHA verification before continuing.
              </p>
              <label className="space-y-1 text-sm text-zinc-700">
                <RecaptchaV2Checkbox onTokenChange={setRecaptchaToken} resetSignal={recaptchaResetSignal} />
                <input
                  type="text"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  autoComplete="off"
                  tabIndex={-1}
                  className="sr-only"
                  aria-hidden="true"
                />
              </label>
              {botError ? <p className="text-sm text-rose-700">{botError}</p> : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                onClick={verifyBotCheck}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Verifying..." : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
