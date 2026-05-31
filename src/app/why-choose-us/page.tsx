import type { Metadata } from "next";
import { MarketplaceComparisonCard } from "@/components/marketplace-comparison-card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Why Choose Us",
  description:
    "See why RentItOut is built around transparent pricing, open browsing, and flexible rental agreements between renters and owners.",
  path: "/why-choose-us",
  keywords: ["why choose RentItOut", "RentItOut benefits", "appliance rental marketplace comparison"],
});

export default function WhyChooseUsPage() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 px-4 py-8 sm:px-6 sm:py-12">
      <MarketplaceComparisonCard />
    </div>
  );
}
