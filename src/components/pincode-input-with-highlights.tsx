"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const COLOR_CLASSES = [
  "border-blue-200 bg-blue-100 text-blue-700",
  "border-purple-200 bg-purple-100 text-purple-700",
  "border-pink-200 bg-pink-100 text-pink-700",
  "border-yellow-200 bg-yellow-100 text-yellow-800",
  "border-green-200 bg-green-100 text-green-700",
] as const;

interface PincodeInputWithHighlightsProps {
  defaultValue: string;
  name?: string;
}

const MAX_PINCODES = 5;

function getColorClass(pincode: string, index: number) {
  let hash = index + 17;
  for (const char of pincode) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return COLOR_CLASSES[Math.abs(hash) % COLOR_CLASSES.length];
}

function normalizePincode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function parsePincodes(value: string) {
  return value
    .split(/\s+/)
    .map((entry) => normalizePincode(entry.trim()))
    .filter((entry) => entry.length > 0)
    .slice(0, MAX_PINCODES);
}

export function PincodeInputWithHighlights({ defaultValue, name = "pincode" }: PincodeInputWithHighlightsProps) {
  const [pincodes, setPincodes] = useState<string[]>(() => parsePincodes(defaultValue));
  const [draft, setDraft] = useState("");

  const coloredPincodes = useMemo(() => {
    return pincodes.map((pincode, index) => ({
      pincode,
      colorClass: getColorClass(pincode, index),
    }));
  }, [pincodes]);

  const addPincode = (rawValue: string) => {
    const normalized = normalizePincode(rawValue);
    if (!normalized) return;

    setPincodes((current) => {
      if (current.length >= MAX_PINCODES || current.includes(normalized)) return current;
      return [...current, normalized];
    });
  };

  const commitDraft = () => {
    if (!draft.trim()) return;
    addPincode(draft);
    setDraft("");
  };

  const removePincode = (target: string) => {
    setPincodes((current) => current.filter((entry) => entry !== target));
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={pincodes.join(" ")} />
      <div className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-2 py-1.5 transition focus-within:border-zinc-500">
        {coloredPincodes.map((entry) => (
          <span
            key={entry.pincode}
            className={cn("relative inline-flex rounded-md border px-2 py-1 pr-5 text-xs font-semibold", entry.colorClass)}
          >
            {entry.pincode}
            <button
              type="button"
              onClick={() => removePincode(entry.pincode)}
              aria-label={`Remove pincode ${entry.pincode}`}
              className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-red-200 bg-red-600 text-white hover:bg-red-500"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(event) => setDraft(normalizePincode(event.target.value))}
          onKeyDown={(event) => {
            if ((event.key === " " || event.key === "Enter") && draft.trim()) {
              event.preventDefault();
              commitDraft();
            }
            if (event.key === "Backspace" && !draft && pincodes.length > 0) {
              event.preventDefault();
              setPincodes((current) => current.slice(0, -1));
            }
          }}
          onBlur={commitDraft}
          inputMode="numeric"
          disabled={pincodes.length >= MAX_PINCODES}
          placeholder={pincodes.length >= MAX_PINCODES ? "Max 5 pincodes" : "Type pincode, press space"}
          className="min-w-[96px] flex-1 bg-transparent px-1 py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed sm:min-w-[140px]"
        />
      </div>

      {coloredPincodes.length > 0 ? (
        <p className="text-xs text-zinc-500">Use space to add next pincode. Maximum 5 pincodes.</p>
      ) : null}
    </div>
  );
}
