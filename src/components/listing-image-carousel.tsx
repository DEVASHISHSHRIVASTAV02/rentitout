"use client";

/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface ListingImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  sizes?: string;
  imageFit?: "cover" | "contain";
  imageContainerClassName?: string;
  hideDefaultFrame?: boolean;
}

function normalizeListingImageSrc(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/api/uploads/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return `/api${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/uploads/")) {
      return `/api${parsed.pathname}${parsed.search}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function wrapIndex(next: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (next + total) % total;
}

export function ListingImageCarousel({
  images,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  imageFit = "cover",
  imageContainerClassName,
  hideDefaultFrame = false,
}: ListingImageCarouselProps) {
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});

  const normalizedImages = useMemo(
    () =>
      images
        .filter((image) => typeof image === "string" && image.trim().length > 0)
        .map(normalizeListingImageSrc)
        .filter((image) => image.length > 0),
    [images],
  );
  const total = normalizedImages.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndex = total > 0 ? wrapIndex(activeIndex, total) : 0;
  const currentImageSrc = total > 0 ? normalizedImages[currentIndex] : "";
  const isCurrentImageFailed = currentImageSrc in failedImages;

  const showPrevious = () => {
    setActiveIndex((current) => wrapIndex(current - 1, total));
  };

  const showNext = () => {
    setActiveIndex((current) => wrapIndex(current + 1, total));
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-100",
        hideDefaultFrame ? null : "rounded-xl border border-zinc-200",
        className,
      )}
    >
      {total > 0 ? (
        <>
          <div className={cn("relative aspect-[16/10] w-full", imageContainerClassName)}>
            {!isCurrentImageFailed ? (
              <img
                src={currentImageSrc}
                alt={`${alt} image ${currentIndex + 1}`}
                loading="lazy"
                decoding="async"
                sizes={sizes}
                onError={() => {
                  const failedSrc = normalizedImages[currentIndex];
                  if (!failedSrc) {
                    return;
                  }
                  setFailedImages((current) => ({ ...current, [failedSrc]: true }));
                }}
                className={cn(
                  "absolute inset-0 h-full w-full",
                  imageFit === "contain" ? "object-contain" : "object-cover",
                )}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-zinc-500">
                <ImageOff className="h-4 w-4" />
                <span>No image</span>
              </div>
            )}
          </div>

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Show previous image"
                className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-sm transition hover:bg-white hover:text-zinc-950"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Show next image"
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-sm transition hover:bg-white hover:text-zinc-950"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="absolute bottom-2 right-2 rounded-full border border-zinc-200 bg-white/95 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                {currentIndex + 1} / {total}
              </span>
            </>
          ) : null}
        </>
      ) : (
        <div className={cn("flex aspect-[16/10] w-full items-center justify-center gap-2 text-sm text-zinc-500", imageContainerClassName)}>
          <ImageOff className="h-4 w-4" />
          <span>No image</span>
        </div>
      )}
    </div>
  );
}
