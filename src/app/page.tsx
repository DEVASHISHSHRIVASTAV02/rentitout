import type { Metadata } from "next";
import { ApplianceQuickButtons } from "@/components/appliance-quick-buttons";
import { CityQuickButtons } from "@/components/city-quick-buttons";
import { HeroCarousel } from "@/components/hero-carousel";
import { buildPageMetadata } from "@/lib/seo";

const homeMetadata = buildPageMetadata({
  title: "Rent Appliances by City",
  description:
    "Browse appliance rentals across major cities with quick category and city shortcuts on RentItOut.",
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
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-7 px-4 pb-0 pt-6 sm:space-y-8 sm:px-6 sm:pb-0 sm:pt-12">
      <HeroCarousel />

      <section className="min-w-0 space-y-4" aria-label="Quick appliance buttons">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">Appliances</h2>
        </div>
        <ApplianceQuickButtons />
      </section>

      <section className="-mx-4 min-w-0 bg-[#f6f6f6] pb-5 pt-10 sm:-mx-6 sm:pb-6 sm:pt-14" aria-label="Browse by city">
        <div className="mx-auto w-full max-w-screen-2xl min-w-0 px-4 sm:px-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-zinc-950 sm:text-2xl">Cities</h2>
          </div>
          <CityQuickButtons className="mt-4" />
        </div>
      </section>
    </div>
  );
}
