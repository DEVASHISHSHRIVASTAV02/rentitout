"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mail, MapPin, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
import { RecaptchaV2Checkbox } from "@/components/recaptcha-v2-checkbox";
import { Button } from "@/components/ui/button";
import { revealContactDetails } from "@/lib/contact-gate-client";
import { type RevealedContactDetails } from "@/lib/contact-gate-types";
import { getListingDetailFields } from "@/lib/listing-details";
import { fetchListingImages } from "@/lib/listing-images-client";
import { type PublicApplianceListing } from "@/lib/types";

interface BrowseContactDetailsFlowProps {
  listing: PublicApplianceListing;
  openOnMount?: boolean;
}

export function BrowseContactDetailsFlow({ listing, openOnMount = false }: BrowseContactDetailsFlowProps) {
  const [isBotCheckOpen, setIsBotCheckOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaResetSignal, setRecaptchaResetSignal] = useState(0);
  const [revealedContact, setRevealedContact] = useState<RevealedContactDetails | null>(null);
  const [botError, setBotError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedImageUrls, setResolvedImageUrls] = useState(listing.image_urls);
  const [hasLoadedFullImages, setHasLoadedFullImages] = useState(false);
  const [isLoadingFullImages, setIsLoadingFullImages] = useState(false);
  const hasAutoOpenedOnMount = useRef(false);

  const detailFields = getListingDetailFields({
    category: listing.category,
    subCategory: listing.sub_category,
    itemInfo: listing.item_info,
  });

  useEffect(() => {
    const hasOpenModal = isBotCheckOpen || isDetailsOpen;
    document.body.classList.toggle("modal-open", hasOpenModal);

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isBotCheckOpen, isDetailsOpen]);

  const loadFullImageUrls = async () => {
    if (hasLoadedFullImages || isLoadingFullImages) {
      return;
    }

    setIsLoadingFullImages(true);
    try {
      const imageUrls = await fetchListingImages(listing.id);
      if (imageUrls.length > 0) {
        setResolvedImageUrls(imageUrls);
      }
    } catch {
      // Keep thumbnail fallback when full image fetch fails.
    } finally {
      setHasLoadedFullImages(true);
      setIsLoadingFullImages(false);
    }
  };

  const openBotCheck = useCallback(() => {
    setIsBotCheckOpen(true);
    setBotError("");
    setHoneypot("");
    setRecaptchaToken(null);
    setRecaptchaResetSignal((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!openOnMount || hasAutoOpenedOnMount.current) {
      return;
    }
    hasAutoOpenedOnMount.current = true;
    openBotCheck();
  }, [openOnMount, openBotCheck]);

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
      setIsBotCheckOpen(false);
      setIsDetailsOpen(true);
      void loadFullImageUrls();
      setHoneypot("");
      setRecaptchaToken(null);
      setRecaptchaResetSignal((value) => value + 1);
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
      <Button
        type="button"
        variant="primary"
        className="w-full"
        onClick={openBotCheck}
      >
        Contact Details
      </Button>

      {typeof document !== "undefined"
        ? createPortal(
            <>
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
                        onClick={() => {
                          setIsBotCheckOpen(false);
                          setBotError("");
                          setHoneypot("");
                          setRecaptchaToken(null);
                          setRecaptchaResetSignal((value) => value + 1);
                        }}
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
                        images={resolvedImageUrls}
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
                        <p className="mb-2 text-sm font-medium text-zinc-900">Owner&apos;s Contact Details</p>
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

