"use client";

import Image from "next/image";
import { useState } from "react";
import { Mail, Phone, RefreshCw, ShieldCheck, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchContactChallenge, revealContactDetails } from "@/lib/contact-gate-client";
import { type ContactCaptchaChallenge, type RevealedContactDetails } from "@/lib/contact-gate-types";

interface GetOwnerDetailsCardProps {
  listingId: string;
  ownerName: string | null;
}

export function GetOwnerDetailsCard({ listingId, ownerName }: GetOwnerDetailsCardProps) {
  const [isBotCheckOpen, setIsBotCheckOpen] = useState(false);
  const [challenge, setChallenge] = useState<ContactCaptchaChallenge | null>(null);
  const [botAnswer, setBotAnswer] = useState("");
  const [botError, setBotError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [revealed, setRevealed] = useState<RevealedContactDetails | null>(null);
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestChallenge = async () => {
    setIsChallengeLoading(true);
    setBotError("");
    setBotAnswer("");
    setHoneypot("");

    try {
      const nextChallenge = await fetchContactChallenge(listingId);
      setChallenge(nextChallenge);
    } catch (error) {
      setChallenge(null);
      setBotError(error instanceof Error ? error.message : "Unable to load challenge right now.");
    } finally {
      setIsChallengeLoading(false);
    }
  };

  const openBotCheck = async () => {
    setIsBotCheckOpen(true);
    await requestChallenge();
  };

  const verifyBotCheck = async () => {
    if (!challenge) {
      setBotError("Challenge expired. Please request a new one.");
      return;
    }

    if (!botAnswer.trim()) {
      setBotError("Please type the verification code.");
      return;
    }

    setIsSubmitting(true);
    setBotError("");
    try {
      const details = await revealContactDetails({
        listingId,
        challengeId: challenge.challengeId,
        answer: botAnswer,
        website: honeypot,
      });
      setRevealed(details);
      setIsBotCheckOpen(false);
      setBotAnswer("");
      setHoneypot("");
    } catch (error) {
      setBotError(error instanceof Error ? error.message : "Verification failed.");
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
                onClick={() => setIsBotCheckOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close bot check"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 text-sm text-zinc-700">
                <ShieldCheck className="h-4 w-4" />
                Enter the code exactly as shown. It expires quickly and is case-sensitive.
              </p>
              <label className="space-y-1 text-sm text-zinc-700">
                <span className="relative block overflow-hidden rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2">
                  {isChallengeLoading ? (
                    <span className="block py-5 text-center text-sm text-zinc-600">Loading challenge...</span>
                  ) : challenge ? (
                    <Image
                      src={challenge.captchaSvgDataUrl}
                      alt="Verification code"
                      width={250}
                      height={84}
                      unoptimized
                      className="mx-auto h-[72px] w-full select-none rounded object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="block py-5 text-center text-sm text-zinc-600">Challenge unavailable</span>
                  )}
                </span>
                <Input
                  value={botAnswer}
                  onChange={(event) => setBotAnswer(event.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Type code (exact case)"
                  disabled={isSubmitting}
                />
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
                variant="ghost"
                onClick={requestChallenge}
                disabled={isChallengeLoading || isSubmitting}
                className="inline-flex w-full items-center justify-center gap-1 sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                New Question
              </Button>
              <Button
                type="button"
                onClick={verifyBotCheck}
                disabled={!challenge || isSubmitting}
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
