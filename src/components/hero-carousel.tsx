"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, FileCheck2, HousePlus, Megaphone, ShieldCheck, UserRoundSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AUTO_CHANGE_MS = 3000;
const LISTING_CTA_HREF = "/auth/sign-in?next=%2Fmy-account";
const HOME_NO_PREFETCH_ROUTES = new Set(["/rental-agreement-templates", "/faqs", LISTING_CTA_HREF]);

interface HeroAction {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  className?: string;
}

interface HeroCard {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  backgroundClass: string;
  primaryAction: HeroAction;
  secondaryAction?: HeroAction;
}

const heroCards: HeroCard[] = [
  {
    badge: "SMART LIVING, LESS WASTE",
    title: "Rent Appliances Instead of Buying Everything Again.",
    description:
      "RentItOut connects people with unused appliances to people settling into a new city. Find reliable essentials quickly at a fraction of buying cost.",
    icon: HousePlus,
    backgroundClass: "border-cyan-200 bg-gradient-to-br from-cyan-200 via-sky-100 to-white",
    primaryAction: {
      href: "/browse",
      label: "Browse Appliances",
      className: "bg-zinc-950 text-white hover:bg-zinc-800",
    },
    secondaryAction: {
      href: LISTING_CTA_HREF,
      label: "List Your Appliance",
      variant: "secondary",
    },
  },
  {
    badge: "OPEN ACCESS, FAST DECISIONS",
    title: "View Poster Information Easily Without Login Hassle.",
    description:
      "Check appliance details and poster information quickly without signing in first, so you can choose what you need without extra friction.",
    icon: UserRoundSearch,
    backgroundClass: "border-emerald-200 bg-gradient-to-br from-emerald-200 via-teal-100 to-white",
    primaryAction: {
      href: "/browse",
      label: "See Available Appliances",
      className: "bg-emerald-700 text-white hover:bg-emerald-600",
    },
  },
  {
    badge: "CITY MOVE MARKETING",
    title: "Moved to a New City? Rent for the Short Time You Need.",
    description:
      "Perfect for internships, temporary projects, and short stays. Get essentials only for your required duration instead of buying everything upfront.",
    icon: Megaphone,
    backgroundClass: "border-amber-200 bg-gradient-to-br from-amber-200 via-orange-100 to-white",
    primaryAction: {
      href: "/browse",
      label: "Find Short-Term Rentals",
      className: "bg-orange-700 text-white hover:bg-orange-600",
    },
  },
  {
    badge: "OWNER-FIRST PRICING",
    title: "Rent It Out on Your Own Agreement and Final Price.",
    description:
      "You stay in control of your terms. Set your own rental conditions, timeline, and final price, then connect directly with interested renters.",
    icon: ShieldCheck,
    backgroundClass: "border-blue-200 bg-gradient-to-br from-blue-200 via-indigo-100 to-white",
    primaryAction: {
      href: LISTING_CTA_HREF,
      label: "Start Listing",
      className: "bg-blue-700 text-white hover:bg-blue-600",
    },
    secondaryAction: {
      href: LISTING_CTA_HREF,
      label: "Open My Account",
      variant: "secondary",
    },
  },
  {
    badge: "LEGAL SAFETY READY",
    title: "Professional Agreements and Insurance Safety, No Future Legal Trouble.",
    description:
      "Use professionally prepared agreement and safety terms to protect both sides and reduce legal risks from day one.",
    icon: FileCheck2,
    backgroundClass: "border-lime-200 bg-gradient-to-br from-lime-200 via-green-100 to-white",
    primaryAction: {
      href: "/rental-agreement-templates",
      label: "Go to Agreements",
      className: "bg-lime-700 text-white hover:bg-lime-600",
    },
    secondaryAction: {
      href: "/browse",
      label: "Browse Appliances",
      variant: "secondary",
    },
  },
];

function wrapIndex(next: number) {
  if (next < 0) return heroCards.length - 1;
  if (next >= heroCards.length) return 0;
  return next;
}

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  useEffect(() => {
    if (!isAutoRotate) return;

    const timerId = window.setInterval(() => {
      setActiveIndex((current) => wrapIndex(current + 1));
    }, AUTO_CHANGE_MS);

    return () => window.clearInterval(timerId);
  }, [isAutoRotate]);

  const stopAutoRotate = () => setIsAutoRotate(false);

  const showPrevious = () => {
    stopAutoRotate();
    setActiveIndex((current) => wrapIndex(current - 1));
  };
  const showNext = () => {
    stopAutoRotate();
    setActiveIndex((current) => wrapIndex(current + 1));
  };

  return (
    <section aria-label="RentItOut highlights carousel">
      <div className="overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {heroCards.map((card, index) => {
            const Icon = card.icon;
            const HeadingTag = index === activeIndex ? "h1" : "h2";

            return (
              <article
                key={card.title}
                onClick={stopAutoRotate}
                className={cn(
                  "relative w-full shrink-0 overflow-hidden rounded-3xl border px-4 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8",
                  card.backgroundClass,
                )}
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/45 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-16 h-64 w-64 rounded-full bg-white/35 blur-3xl" />

                <div className="relative space-y-5">
                  <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-zinc-900/10 bg-white/75 px-3 py-1 text-[11px] leading-tight tracking-[0.14em] text-zinc-700 backdrop-blur-sm sm:px-4 sm:text-xs sm:tracking-[0.2em]">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{card.badge}</span>
                  </div>

                  <div className="max-w-3xl space-y-3">
                    <HeadingTag className="text-2xl font-semibold leading-tight text-zinc-950 sm:text-3xl lg:text-4xl">
                      {card.title}
                    </HeadingTag>
                    <p className="max-w-2xl text-sm leading-6 text-zinc-700 sm:text-base">{card.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={card.primaryAction.href}
                      prefetch={HOME_NO_PREFETCH_ROUTES.has(card.primaryAction.href) ? false : undefined}
                      className="w-full sm:w-auto"
                    >
                      <Button className={cn("h-10 w-full px-5 sm:w-auto", card.primaryAction.className)}>
                        {card.primaryAction.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>

                    {card.secondaryAction ? (
                      <Link
                        href={card.secondaryAction.href}
                        prefetch={HOME_NO_PREFETCH_ROUTES.has(card.secondaryAction.href) ? false : undefined}
                        className="w-full sm:w-auto"
                      >
                        <Button
                          variant={card.secondaryAction.variant ?? "secondary"}
                          className={cn("h-10 w-full px-5 sm:w-auto", card.secondaryAction.className)}
                        >
                          {card.secondaryAction.label}
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          {heroCards.map((card, index) => (
            <button
              key={card.title}
              type="button"
              onClick={() => {
                stopAutoRotate();
                setActiveIndex(index);
              }}
              aria-label={`Show card ${index + 1}`}
              className={cn(
                "h-2.5 rounded-full transition-all",
                index === activeIndex ? "w-9 bg-zinc-900" : "w-2.5 bg-zinc-300 hover:bg-zinc-400",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Show previous card"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Show next card"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
