import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { SEO_CITY_CATEGORY_INTENTS } from "@/lib/seo-landing-pages";

export const metadata: Metadata = buildPageMetadata({
  title: "City and Category Rental Pages",
  description:
    "Explore all RentItOut city and category rental pages to compare appliance rental options by location and need.",
  path: "/rentals",
  keywords: ["city category rentals", "appliance rentals by city", "rentals directory"],
});

const INTENTS_BY_CITY = new Map<string, Array<(typeof SEO_CITY_CATEGORY_INTENTS)[number]>>();

for (const intent of SEO_CITY_CATEGORY_INTENTS) {
  const existing = INTENTS_BY_CITY.get(intent.city);
  if (existing) {
    existing.push(intent);
  } else {
    INTENTS_BY_CITY.set(intent.city, [intent]);
  }
}

const CITY_SECTIONS = Array.from(INTENTS_BY_CITY.entries());

export default function RentalsIndexPage() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Rental Index</p>
        <h1 className="text-2xl font-semibold text-zinc-950 sm:text-3xl">All City + Category Rental Pages</h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-700 sm:text-base">
          Use this directory to open focused rental pages for every supported city and appliance category combination.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CITY_SECTIONS.map(([city, intents]) => (
          <section key={city} className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-900">{city}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {intents.map((intent) => (
                <li key={`${intent.citySlug}-${intent.categorySlug}`}>
                  <Link href={intent.path} className="text-zinc-700 hover:text-zinc-950 hover:underline">
                    {intent.category} rentals in {intent.city}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
