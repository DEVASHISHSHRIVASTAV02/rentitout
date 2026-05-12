import type { Metadata } from "next";
import Link from "next/link";
import { ApplianceQuickButtons } from "@/components/appliance-quick-buttons";
import { CityQuickButtons } from "@/components/city-quick-buttons";
import { HeroCarousel } from "@/components/hero-carousel";
import { MarketplaceComparisonCard } from "@/components/marketplace-comparison-card";
import { buildPageMetadata } from "@/lib/seo";
import { SEO_CITY_CATEGORY_INTENTS } from "@/lib/seo-landing-pages";

const homeMetadata = buildPageMetadata({
  title: "Rent Appliances by City",
  description:
    "Explore appliance rentals across major cities with quick category links, city shortcuts, and renter-owner connection tools.",
  path: "/",
  keywords: ["home appliance rental", "rent in Delhi", "rent in Mumbai", "rental marketplace India"],
});

export const metadata: Metadata = {
  ...homeMetadata,
  title: {
    absolute: "RentItOut | Rent Appliances in Your City",
  },
};

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-7 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-12">
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
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Top Rental Intents</p>
          <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">Popular City + Category Pages</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {SEO_CITY_CATEGORY_INTENTS.map((intent) => (
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
    </div>
  );
}
