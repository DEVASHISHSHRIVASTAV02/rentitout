"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
import { RecaptchaV2Checkbox } from "@/components/recaptcha-v2-checkbox";
import { Button } from "@/components/ui/button";
import { revealContactDetails } from "@/lib/contact-gate-client";
import { type RevealedContactDetails } from "@/lib/contact-gate-types";
import { getListingDetailFields } from "@/lib/listing-details";
import { type PublicApplianceListing } from "@/lib/types";

interface ListingQuickViewFlowProps {
  listing: PublicApplianceListing;
}

export function ListingQuickViewFlow({ listing }: ListingQuickViewFlowProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [revealedContact, setRevealedContact] = useState<RevealedContactDetails | null>(null);
  const [botError, setBotError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detailFields = useMemo(
    () =>
      getListingDetailFields({
        category: listing.category,
        subCategory: listing.sub_category,
        itemInfo: listing.item_info,
      }),
    [listing.category, listing.sub_category, listing.item_info],
  );

  useEffect(() => {
    const hasOpenModal = isQuickViewOpen || isCaptchaOpen;
    document.body.classList.toggle("modal-open", hasOpenModal);

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isQuickViewOpen, isCaptchaOpen]);

  const openBotCheck = () => {
    setIsCaptchaOpen(true);
    setBotError("");
    setHoneypot("");
    setRecaptchaToken(null);
    setRecaptchaResetSignal((value) => value + 1);
  };

  const closeBotCheck = () => {
    setIsCaptchaOpen(false);
    setBotError("");
    setHoneypot("");
    setRecaptchaToken(null);
    setRecaptchaResetSignal((value) => value + 1);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
    setIsCaptchaOpen(false);
    setRevealedContact(null);
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
        listingId: listing.id,
        recaptchaToken,
        website: honeypot,
      });

      setRevealedContact(details);
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
      <button
        type="button"
        onClick={() => setIsQuickViewOpen(true)}
        className="w-full truncate text-left text-base font-semibold text-white hover:text-white/90 hover:underline"
      >
        {listing.category}
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <>
              {isQuickViewOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 p-4 sm:p-6">
                  <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-zinc-300 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6">
                      <h3 className="truncate text-xl font-semibold text-zinc-950">{listing.category}</h3>
                      <button
                        type="button"
                        onClick={closeQuickView}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label="Close quick view"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
                      <ListingImageCarousel
                        images={listing.image_urls}
                        alt={`${listing.category} listing`}
                        className="border-zinc-200"
                        imageFit="contain"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />

                      <div className="space-y-2 text-sm text-zinc-700">
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
                    </div>

                    <div className="border-t border-zinc-200 p-4 sm:p-6">
                      {revealedContact ? (
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-sm font-semibold text-zinc-900">Contact Details</p>
                          <div className="mt-3 space-y-2 text-sm text-zinc-700">
                            <p className="flex items-center gap-2">
                              <UserRound className="h-4 w-4" />
                              Full Name: {revealedContact.ownerName ?? "Listing Owner"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email: {revealedContact.contactEmail ?? "Not shared"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone: {revealedContact.contactPhone ?? "Not shared"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Button type="button" variant="primary" className="w-full sm:w-auto" onClick={openBotCheck}>
                          Contact Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {isCaptchaOpen ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 px-4">
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
            </>,
            document.body,
          )
        : null}
    </>
  );
}
