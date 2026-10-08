"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface ErrorMessagePopupProps {
  message: string;
  /** Query keys to strip from the URL when the popup is dismissed. Defaults to ["error"]. */
  clearQueryKeys?: string[];
}

export function ErrorMessagePopup({ message, clearQueryKeys = ["error"] }: ErrorMessagePopupProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(Boolean(message.trim()));
  const isBrowser = typeof document !== "undefined";

  useEffect(() => {
    setIsOpen(Boolean(message.trim()));
  }, [message]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const dismiss = () => {
    setIsOpen(false);
    if (clearQueryKeys.length === 0 || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    let changed = false;
    for (const key of clearQueryKeys) {
      if (params.has(key)) {
        params.delete(key);
        changed = true;
      }
    }
    if (!changed) {
      return;
    }

    const path = window.location.pathname;
    const query = params.toString();
    router.replace(`${path}${query ? `?${query}` : ""}`, { scroll: false });
  };

  if (!isOpen || !isBrowser) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/60 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-popup-title"
        aria-describedby="error-popup-message"
        className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="error-popup-title" className="text-xl font-semibold text-rose-700">
            Error
          </h2>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
            aria-label="Close error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p id="error-popup-message" className="mt-3 text-sm text-rose-700 sm:text-base">
          {message}
        </p>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            className="w-full bg-rose-700 text-white hover:bg-rose-800 sm:w-auto"
            onClick={dismiss}
          >
            Okay
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
