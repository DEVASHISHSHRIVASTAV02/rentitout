import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import { getPublicListings } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { getSeoIntentBySlugs, SEO_CITY_CATEGORY_INTENTS } from "@/lib/seo-landing-pages";

interface CityCategoryLandingPageProps {
  params: Promise<{ city: string; category: string }>;
}

export function generateStaticParams() {
  return SEO_CITY_CATEGORY_INTENTS.map((intent) => ({
    city: intent.citySlug,
    category: intent.categorySlug,
  }));
}

export async function generateMetadata({ params }: CityCategoryLandingPageProps): Promise<Metadata> {
  const { city, category } = await params;
  const intent = getSeoIntentBySlugs(city, category);

  if (!intent) {
    return buildPageMetadata({
      title: "Rental Listings",
      description: "Browse appliance rental listings on RentItOut.",
      path: "/browse",
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${intent.category} Rentals in ${intent.city}`,
    description: `Compare verified ${intent.category.toLowerCase()} rental listings in ${intent.city} with monthly pricing and flexible agreement options.`,
    path: intent.path,
    keywords: [
      `${intent.category} on rent in ${intent.city}`,
      `${intent.city} ${intent.category} rentals`,
      `${intent.category.toLowerCase()} rental ${intent.city.toLowerCase()}`,
    ],
  });
}

export default async function CityCategoryLandingPage({ params }: CityCategoryLandingPageProps) {
  const { city, category } = await params;
  const intent = getSeoIntentBySlugs(city, category);

  if (!intent) {
    notFound();
  }

  const listingsPage = await getPublicListings({
    city: intent.city,
    category: intent.category,
    sortBy: "price_low_to_high",
    page: 1,
    pageSize: 12,
  });

  const browseHref = `/browse?city=${encodeURIComponent(intent.city)}&category=${encodeURIComponent(intent.category)}`;

  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-12">
      <header className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">City + Category Rentals</p>
        <h1 className="text-2xl font-semibold text-zinc-950 sm:text-3xl">
          {intent.category} Rentals in {intent.city}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-700 sm:text-base">
          Browse active {intent.category.toLowerCase()} listings in {intent.city}. Compare monthly rent, agreement
          duration, and listing details before connecting with owners.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href={browseHref}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Filter &amp; Search This Intent
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
          >
            Browse All Categories
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-950 sm:text-xl">
          Available {intent.category} Listings in {intent.city}
        </h2>
        {listingsPage.listings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {listingsPage.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700 sm:p-8">
            No active listings found right now for this city and category. Use browse filters to check nearby options.
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="text-base font-semibold text-zinc-900">Compare by Budget</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Sort by monthly rent and use min/max price filters to shortlist listings quickly.
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="text-base font-semibold text-zinc-900">Verify Listing Details</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Open listing details to review category-specific information and agreement expectations before contacting.
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="text-base font-semibold text-zinc-900">Connect with Owners</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Use the secure contact-reveal flow to access owner details and continue negotiations offline.
          </p>
        </article>
      </section>
    </div>
  );
}
