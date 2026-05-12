"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

interface CopyListingIdButtonProps {
  listingId: string;
}

type CopyState = "idle" | "copied" | "failed";

function fallbackCopyText(value: string) {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textArea);
  return success;
}

export function CopyListingIdButton({ listingId }: CopyListingIdButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") {
      return;
    }
    const timer = window.setTimeout(() => {
      setState("idle");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copyListingId = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(listingId);
      } else {
        const copied = fallbackCopyText(listingId);
        if (!copied) {
          throw new Error("Clipboard unavailable");
        }
      }
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <button
      type="button"
      onClick={copyListingId}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
      aria-live="polite"
      aria-label={
        state === "copied"
          ? `Listing ID ${listingId} copied`
          : state === "failed"
            ? `Retry copy listing ID ${listingId}`
            : `Copy listing ID ${listingId}`
      }
      title={state === "copied" ? "Copied" : state === "failed" ? "Retry copy" : "Copy listing ID"}
    >
      {state === "copied" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
