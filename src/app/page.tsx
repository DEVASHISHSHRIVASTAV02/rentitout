import { ApplianceQuickButtons } from "@/components/appliance-quick-buttons";
import { CityQuickButtons } from "@/components/city-quick-buttons";
import { HeroCarousel } from "@/components/hero-carousel";
import { MarketplaceComparisonCard } from "@/components/marketplace-comparison-card";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <HeroCarousel />

      <section className="mt-7 min-w-0 space-y-4" aria-label="Quick appliance buttons">
        <div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Quick Browse</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950 sm:text-2xl">Appliances</h2>
          </div>
        </div>
        <ApplianceQuickButtons />

        <div className="relative left-1/2 right-1/2 mt-5 w-screen -translate-x-1/2 bg-black pt-12 pb-14 sm:pt-16 sm:pb-20">
          <div className="mx-auto w-full max-w-screen-2xl min-w-0 px-4 sm:px-6">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Cities</h2>
            <CityQuickButtons className="mt-[0.9rem]" />
          </div>
        </div>

        <MarketplaceComparisonCard />
      </section>
    </div>
  );
}
