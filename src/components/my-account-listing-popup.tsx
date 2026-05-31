"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CreateListingForm } from "@/components/create-listing-form";
import { Button } from "@/components/ui/button";

interface MyAccountListingPopupProps {
  defaultContactEmail: string;
  autoOpen?: boolean;
  triggerLabel?: string;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerClassName?: string;
  onTriggerClick?: () => void;
}

export function MyAccountListingPopup({
  defaultContactEmail,
  autoOpen = false,
  triggerLabel = "Create A Listing",
  triggerVariant = "primary",
  triggerClassName,
  onTriggerClick,
}: MyAccountListingPopupProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(autoOpen);
  const isBrowser = typeof document !== "undefined";

  useEffect(() => {
    if (!autoOpen) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("newListing") !== "1") {
      return;
    }

    params.delete("newListing");
    const query = params.toString();
    router.replace(`/my-account${query ? `?${query}` : ""}`, { scroll: false });
  }, [autoOpen, router]);

  useEffect(() => {
    document.body.classList.toggle("modal-open", isOpen);
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/50 px-4 py-5 sm:py-8">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">My Account</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950 sm:text-2xl">Create A Listing</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close listing form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <CreateListingForm defaultContactEmail={defaultContactEmail} redirectTo="/my-account" onCancel={() => setIsOpen(false)} />
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        className={triggerClassName}
        onClick={() => {
          onTriggerClick?.();
          setIsOpen(true);
        }}
      >
        {triggerLabel}
      </Button>

      {isBrowser && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
