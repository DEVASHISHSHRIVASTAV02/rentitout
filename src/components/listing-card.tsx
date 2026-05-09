import { MapPin } from "lucide-react";
import { BrowseContactDetailsFlow } from "@/components/browse-contact-details-flow";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
import { ListingQuickViewFlow } from "@/components/listing-quick-view-flow";
import { getCategoryGradientClass } from "@/lib/category-gradient";
import { getListingDetailFields } from "@/lib/listing-details";
import { type PublicApplianceListing } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: PublicApplianceListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const detailFields = getListingDetailFields({
    category: listing.category,
    subCategory: listing.sub_category,
    itemInfo: listing.item_info,
  });

  return (
    <article
      className={cn(
        "listing-card group relative min-h-[420px] overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br text-white shadow-sm transition-all duration-200 hover:z-10 hover:scale-[1.05] hover:border-white/60",
        getCategoryGradientClass(listing.category),
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />
      <div className="relative z-10 flex h-full flex-col p-4">
        <ListingImageCarousel
          images={listing.image_urls}
          alt={`${listing.category} listing`}
          className="border-white/30"
          imageFit="contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="mt-4 min-w-0">
          <ListingQuickViewFlow listing={listing} />
          <div className="mt-1.5 space-y-1 text-sm text-white/90">
            {detailFields.map((field) => (
              <p key={`${field.label}-${field.value}`}>
                <span className="font-semibold text-white">{field.label}:</span> {field.value}
              </p>
            ))}
            <p>
              <span className="font-semibold text-white">Price:</span> INR{" "}
              {listing.price_per_month.toLocaleString("en-IN")} / month
            </p>
            <p>
              <span className="font-semibold text-white">Minimum Agreement:</span>{" "}
              {listing.min_agreement_months} {listing.min_agreement_months === 1 ? "month" : "months"}
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-2 pt-2">
          <p className="text-sm font-mono text-white/80">Listing ID: {listing.listing_id}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/85">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {listing.city}
            </span>
            <span>PIN {listing.pincode}</span>
          </div>
          <BrowseContactDetailsFlow listing={listing} />
        </div>
      </div>
    </article>
  );
}
