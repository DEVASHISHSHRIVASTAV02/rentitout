import { MapPin } from "lucide-react";
import { BrowseContactDetailsFlow } from "@/components/browse-contact-details-flow";
import { CopyListingIdButton } from "@/components/copy-listing-id-button";
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
      className="listing-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#c3c3c8] bg-gradient-to-b from-white to-zinc-50 text-zinc-900 shadow-sm transition-all duration-200 hover:border-zinc-400 hover:-translate-y-0.5 hover:shadow-2xl"
    >
      <ListingQuickViewFlow listing={listing} triggerMode="card-overlay" className="z-10" />

      <div className="pointer-events-none relative z-20 flex flex-1 flex-col">
        <div className="pointer-events-auto">
          <ListingImageCarousel
            images={listing.image_urls}
            alt={`${listing.category} listing`}
            hideDefaultFrame
            className="border-b border-zinc-300"
            imageFit="contain"
            imageContainerClassName="aspect-[16/11] sm:aspect-[4/3]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-left text-base font-semibold text-zinc-900">{listing.category}</h3>
              </div>
              <span className="inline-flex max-w-full items-center gap-1 text-xs font-medium text-zinc-600 sm:shrink-0">
                <MapPin className="h-3.5 w-3.5" />
                <span className="break-words">
                  {listing.city} PIN {listing.pincode}
                </span>
              </span>
            </div>
            <div className="space-y-1 text-sm leading-snug text-zinc-700">
              {detailFields.map((field) => (
                <p key={`${field.label}-${field.value}`} className="break-words">
                  <span className="font-semibold text-zinc-900">{field.label}:</span> {field.value}
                </p>
              ))}
              <p className="break-words">
                <span className="font-semibold text-zinc-900">Monthly Rent:</span> INR{" "}
                {listing.price_per_month.toLocaleString("en-IN")}
              </p>
              <p className="break-words">
                <span className="font-semibold text-zinc-900">Min. Agreement:</span>{" "}
                {listing.min_agreement_months} {listing.min_agreement_months === 1 ? "month" : "months"}
              </p>
              <p className="flex flex-wrap items-center gap-2 break-words">
                <span className="font-semibold text-zinc-900">Listing ID:</span>{" "}
                <span className="break-all font-mono text-zinc-600">{listing.listing_id}</span>
                <span className="pointer-events-auto">
                  <CopyListingIdButton listingId={listing.listing_id} />
                </span>
              </p>
            </div>
          </div>

          <div className="pointer-events-auto mt-auto pt-1">
            <BrowseContactDetailsFlow listing={listing} />
          </div>
        </div>
      </div>
    </article>
  );
}
