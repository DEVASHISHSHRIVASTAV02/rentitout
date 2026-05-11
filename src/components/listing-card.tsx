import { MapPin } from "lucide-react";
import { BrowseContactDetailsFlow } from "@/components/browse-contact-details-flow";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
import { ListingQuickViewFlow } from "@/components/listing-quick-view-flow";
import { getListingDetailFields } from "@/lib/listing-details";
import { type PublicApplianceListing } from "@/lib/types";

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
      className="listing-card group relative min-h-[380px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 shadow-sm transition-all duration-200 hover:z-10 hover:scale-[1.05] hover:border-zinc-300"
    >
      <div className="relative z-10 flex h-full flex-col px-4 pt-4 pb-0">
        <ListingImageCarousel
          images={listing.image_urls}
          alt={`${listing.category} listing`}
          className="-mx-2 -mt-1 border-zinc-200"
          imageFit="contain"
          imageContainerClassName="aspect-[4/3]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="mt-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <ListingQuickViewFlow listing={listing} />
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-600">
              <MapPin className="h-3.5 w-3.5" />
              {listing.city} PIN {listing.pincode}
            </span>
          </div>
          <div className="mt-1 space-y-0.5 text-sm leading-tight text-zinc-700">
            {detailFields.map((field) => (
              <p key={`${field.label}-${field.value}`}>
                <span className="font-semibold text-zinc-900">{field.label}:</span> {field.value}
              </p>
            ))}
            <p>
              <span className="font-semibold text-zinc-900">Monthly Rent:</span> INR{" "}
              {listing.price_per_month.toLocaleString("en-IN")}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Min. Agreement:</span>{" "}
              {listing.min_agreement_months} {listing.min_agreement_months === 1 ? "month" : "months"}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Listing ID:</span>{" "}
              <span className="font-mono text-zinc-600">{listing.listing_id}</span>
            </p>
          </div>
        </div>

        <div className="mt-2">
          <BrowseContactDetailsFlow listing={listing} />
        </div>
      </div>
    </article>
  );
}

