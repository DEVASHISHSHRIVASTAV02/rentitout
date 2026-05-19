import type { Metadata } from "next";
import Link from "next/link";
import { ApplianceQuickButtons } from "@/components/appliance-quick-buttons";
import { CityQuickButtons } from "@/components/city-quick-buttons";
import { HeroCarousel } from "@/components/hero-carousel";
import { HomeRoutePrefetch } from "@/components/home-route-prefetch";
import { MarketplaceComparisonCard } from "@/components/marketplace-comparison-card";
import { buildPageMetadata } from "@/lib/seo";
import { HOMEPAGE_CITY_CATEGORY_INTENTS } from "@/lib/seo-landing-pages";

const homeMetadata = buildPageMetadata({
  title: "Rent Appliances by City",
  description:
    "Explore appliance rentals across major cities with quick category links, city shortcuts, and renter-owner connection tools.",
  path: "/",
  keywords: ["home appliance rental", "rent in Delhi", "rent in Mumbai", "rental marketplace India"],
});

const HOME_FAQS = [
  {
    question: "Is RentItOut the owner of listed appliances?",
    answer:
      "No. RentItOut is a connector platform where owners post listings and renters discover options. Pricing, deposit, transport, and handover are finalized directly between renter and owner.",
  },
  {
    question: "How do I find the right appliance faster?",
    answer:
      "Start with the appliance and city quick buttons on this page, then open Browse to filter by budget, agreement duration, and listing ID. This narrows choices before contacting owners.",
  },
  {
    question: "Why are owner contact details not shown immediately?",
    answer:
      "Contact details are protected behind a reCAPTCHA verification step to reduce spam and automated abuse. Once verification succeeds, eligible contact fields are revealed.",
  },
  {
    question: "What should I confirm before paying any advance?",
    answer:
      "Confirm appliance condition, accessories included, delivery timeline, refund/deposit terms, and agreement duration. Keep a written agreement signed by both parties before making payment.",
  },
  {
    question: "Can I rent for a short duration like 1-3 months?",
    answer:
      "Many owners support short-term rentals, but terms vary by listing. Check the agreement period in listing details and reconfirm flexibility with the owner before closing.",
  },
  {
    question: "I am an owner. Can I edit or remove my listing later?",
    answer:
      "Yes. Owners can manage listings from the dashboard, including updates to pricing, description, and visibility settings, and can remove listings when unavailable.",
  },
  {
    question: "Do you provide rental agreement templates?",
    answer:
      "Yes. You can use the Rental Agreement Templates page for a starting draft, then customize clauses (deposit, damage, pickup/drop, and notice period) as needed.",
  },
] as const;

export const metadata: Metadata = {
  ...homeMetadata,
  title: {
    absolute: "RentItOut | Rent Appliances in Your City",
  },
};

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-7 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-12">
      <HomeRoutePrefetch />
      <HeroCarousel />

      <section className="min-w-0 space-y-4" aria-label="Quick appliance buttons">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Quick Browse</p>
          <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">Appliances</h2>
        </div>
        <ApplianceQuickButtons />
      </section>

      <section className="-mx-4 min-w-0 bg-black py-10 sm:-mx-6 sm:py-14" aria-label="Browse by city">
        <div className="mx-auto w-full max-w-screen-2xl min-w-0 px-4 sm:px-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">City Wise Rentals</p>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Cities</h2>
          </div>
          <CityQuickButtons className="mt-4" />
        </div>
      </section>

      <section className="min-w-0 space-y-4" aria-label="Top city and category pages">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Top Rental Intents</p>
          <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">Popular City + Category Pages</h2>
          <Link href="/rentals" className="inline-flex text-sm font-semibold text-zinc-900 underline-offset-4 hover:underline">
            View all city + category pages
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {HOMEPAGE_CITY_CATEGORY_INTENTS.map((intent) => (
            <Link
              key={`${intent.citySlug}-${intent.categorySlug}`}
              href={intent.path}
              className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-950"
            >
              {intent.category} in {intent.city}
            </Link>
          ))}
        </div>
      </section>

      <MarketplaceComparisonCard />

      <section className="-mx-4 min-w-0 bg-[#f6f6f6] py-10 sm:-mx-6 sm:py-14" aria-label="Frequently asked questions">
        <div className="mx-auto grid w-full max-w-screen-2xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Frequently Asked Questions</h2>
          </div>
          <div>
            {HOME_FAQS.map((faq) => (
              <details key={faq.question} className="group border-b border-zinc-300">
                <summary className="flex cursor-pointer list-none items-start gap-4 py-5 text-base font-medium leading-7 text-zinc-900 marker:content-none sm:text-xl sm:leading-8">
                  <span>{faq.question}</span>
                  <span aria-hidden="true" className="ml-auto shrink-0 text-2xl leading-none text-zinc-900 group-open:hidden">
                    +
                  </span>
                </summary>
                <p className="pb-5 pr-10 text-sm leading-6 text-zinc-700 sm:text-base">{faq.answer}</p>
              </details>
            ))}

            <Link
              href="/faqs"
              prefetch={false}
              className="mt-8 flex w-fit items-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 mx-auto lg:mx-0"
            >
              <span>More FAQs</span>
              <span className="ml-3">&gt;</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
