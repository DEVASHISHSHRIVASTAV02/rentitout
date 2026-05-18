"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { type PublicApplianceListing } from "@/lib/types";

type FlowLoadState = "idle" | "prefetched" | "open";

const LazyListingQuickViewFlow = dynamic(() =>
  import("@/components/listing-quick-view-flow").then((mod) => mod.ListingQuickViewFlow),
);

const LazyBrowseContactDetailsFlow = dynamic(() =>
  import("@/components/browse-contact-details-flow").then((mod) => mod.BrowseContactDetailsFlow),
);

interface ListingCardInteractionsProps {
  listing: PublicApplianceListing;
}

export function ListingCardQuickViewInteraction({ listing }: ListingCardInteractionsProps) {
  const [quickViewLoadState, setQuickViewLoadState] = useState<FlowLoadState>("idle");

  const prefetchQuickView = useCallback(() => {
    setQuickViewLoadState((current) => (current === "idle" ? "prefetched" : current));
  }, []);

  const openQuickView = useCallback(() => {
    setQuickViewLoadState((current) => (current === "open" ? current : "open"));
  }, []);

  return (
    <>
      {quickViewLoadState === "idle" ? (
        <button
          type="button"
          onClick={openQuickView}
          onPointerEnter={prefetchQuickView}
          onTouchStart={prefetchQuickView}
          onFocus={prefetchQuickView}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={`Open quick view for ${listing.category}`}
        >
          <span className="sr-only">Open quick view for {listing.category}</span>
        </button>
      ) : (
        <LazyListingQuickViewFlow
          listing={listing}
          triggerMode="card-overlay"
          className="z-10"
          openOnMount={quickViewLoadState === "open"}
        />
      )}
    </>
  );
}

export function ListingCardContactInteraction({ listing }: ListingCardInteractionsProps) {
  const [contactFlowLoadState, setContactFlowLoadState] = useState<FlowLoadState>("idle");

  const prefetchContactFlow = useCallback(() => {
    setContactFlowLoadState((current) => (current === "idle" ? "prefetched" : current));
  }, []);

  const openContactFlow = useCallback(() => {
    setContactFlowLoadState((current) => (current === "open" ? current : "open"));
  }, []);

  return (
    <div
      className="pointer-events-auto mt-auto pt-1"
      onPointerEnter={prefetchContactFlow}
      onTouchStart={prefetchContactFlow}
      onFocusCapture={prefetchContactFlow}
    >
      {contactFlowLoadState === "idle" ? (
        <Button type="button" variant="primary" className="w-full" onClick={openContactFlow}>
          Contact Details
        </Button>
      ) : (
        <LazyBrowseContactDetailsFlow
          listing={listing}
          openOnMount={contactFlowLoadState === "open"}
        />
      )}
    </div>
  );
}
