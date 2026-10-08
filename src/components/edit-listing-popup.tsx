"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CreateListingForm } from "@/components/create-listing-form";
import { type ListableItem } from "@/lib/listable-items";

export interface EditListingPopupValues {
  id: string;
  listingPublicId: string;
  category: ListableItem;
  subCategory: string;
  itemInfo: string;
  pricePerMonth: number;
  minAgreementMonths: number;
  city: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string | null;
  imageUrls: string[];
}

interface EditListingPopupProps {
  listing: EditListingPopupValues;
  defaultContactEmail: string;
  autoOpen?: boolean;
  onAutoOpenConsumed?: () => void;
}

export function EditListingPopup({
  listing,
  defaultContactEmail,
  autoOpen = false,
  onAutoOpenConsumed,
}: EditListingPopupProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const isBrowser = typeof document !== "undefined";

  useEffect(() => {
    if (!autoOpen) {
      return;
    }
    setIsOpen(true);
    onAutoOpenConsumed?.();
  }, [autoOpen, onAutoOpenConsumed]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/50 px-4 py-5 sm:py-8">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">My Account</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950 sm:text-2xl">Edit Listing</h2>
            <p className="mt-1 break-all font-mono text-xs text-zinc-600">Listing ID: {listing.listingPublicId}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close edit listing form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <CreateListingForm
          key={`${listing.id}-${isOpen ? "open" : "closed"}`}
          defaultContactEmail={defaultContactEmail}
          redirectTo="/my-account"
          onCancel={() => setIsOpen(false)}
          initialValues={{
            id: listing.id,
            listingPublicId: listing.listingPublicId,
            category: listing.category,
            subCategory: listing.subCategory,
            itemInfo: listing.itemInfo,
            pricePerMonth: listing.pricePerMonth,
            minAgreementMonths: listing.minAgreementMonths,
            city: listing.city,
            pincode: listing.pincode,
            contactEmail: listing.contactEmail,
            contactPhone: listing.contactPhone,
            imageUrls: listing.imageUrls,
          }}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
      >
        Edit
      </button>

      {isBrowser && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
