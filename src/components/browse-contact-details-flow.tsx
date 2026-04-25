"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Mail, MapPin, Phone, RefreshCw, ShieldCheck, UserRound, X } from "lucide-react";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchContactChallenge, revealContactDetails } from "@/lib/contact-gate-client";
import { type ContactCaptchaChallenge, type RevealedContactDetails } from "@/lib/contact-gate-types";
import { getListingDetailFields } from "@/lib/listing-details";
import { type PublicApplianceListing } from "@/lib/types";

interface BrowseContactDetailsFlowProps {
  listing: PublicApplianceListing;
}

export function BrowseContactDetailsFlow({ listing }: BrowseContactDetailsFlowProps) {
  const [isBotCheckOpen, setIsBotCheckOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [challenge, setChallenge] = useState<ContactCaptchaChallenge | null>(null);
  const [revealedContact, setRevealedContact] = useState<RevealedContactDetails | null>(null);
  const [botAnswer, setBotAnswer] = useState("");
  const [botError, setBotError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detailFields = getListingDetailFields({
    category: listing.category,
    subCategory: listing.sub_category,
    itemInfo: listing.item_info,
  });

  const requestChallenge = async () => {
    setIsChallengeLoading(true);
    setBotError("");
    setBotAnswer("");
    setHoneypot("");

    try {
      const nextChallenge = await fetchContactChallenge(listing.id);
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
      setBotError("Challenge expired. Please generate a new one.");
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
        listingId: listing.id,
        challengeId: challenge.challengeId,
        answer: botAnswer,
        website: honeypot,
      });

      setRevealedContact(details);
      setIsBotCheckOpen(false);
      setIsDetailsOpen(true);
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
      <Button type="button" variant="secondary" className="mt-2 w-full" onClick={openBotCheck}>
        Contact Details
      </Button>

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

      {isDetailsOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/50 px-4 py-8 sm:py-12">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Contact Details</p>
                <h3 className="mt-1 text-xl font-semibold text-zinc-950">{listing.category}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close contact details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <ListingImageCarousel
                images={listing.image_urls}
                alt={`${listing.category} listing`}
                className="border-zinc-200"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />

              <div className="space-y-1.5 text-sm text-zinc-700">
                {detailFields.map((field) => (
                  <p key={`${field.label}-${field.value}`}>
                    <span className="font-medium text-zinc-800">{field.label}:</span> {field.value}
                  </p>
                ))}
                <p>
                  <span className="font-medium text-zinc-800">Price:</span> INR{" "}
                  {listing.price_per_month.toLocaleString("en-IN")} / month
                </p>
                <p>
                  <span className="font-medium text-zinc-800">Minimum Agreement:</span>{" "}
                  {listing.min_agreement_months} {listing.min_agreement_months === 1 ? "month" : "months"}
                </p>
                <p>
                  <span className="font-medium text-zinc-800">Listing ID:</span> {listing.listing_id}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {listing.city} - PIN {listing.pincode}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-2 text-sm font-medium text-zinc-900">Owner Contact</p>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm text-zinc-700">
                    <UserRound className="h-4 w-4" />
                    {revealedContact?.ownerName ?? "Listing Owner"}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-zinc-700">
                    <Mail className="h-4 w-4" />
                    {revealedContact?.contactEmail ?? "Not shared"}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-zinc-700">
                    <Phone className="h-4 w-4" />
                    {revealedContact?.contactPhone ?? "Not shared"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href={`/listings/${listing.id}`} className="w-full sm:w-auto">
                  <Button variant="secondary" type="button" className="w-full sm:w-auto">
                    View Full Listing Page
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
