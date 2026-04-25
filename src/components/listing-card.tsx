import { BrowseContactDetailsFlow } from "@/components/browse-contact-details-flow";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
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
    <article className="group min-h-[420px] overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300">
      <div className="flex h-full flex-col p-4">
        <ListingImageCarousel
          images={listing.image_urls}
          alt={`${listing.category} listing`}
          className="border-zinc-200"
          imageFit="contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="mt-4 min-w-0">
          <Link href={`/listings/${listing.id}`} className="block">
            <h3 className="truncate text-base font-semibold text-zinc-900 hover:underline">{listing.category}</h3>
          </Link>
          <div className="mt-1.5 space-y-1 text-sm text-zinc-700">
            {detailFields.map((field) => (
              <p key={`${field.label}-${field.value}`}>
                <span className="font-medium text-zinc-800">{field.label}:</span> {field.value}
              </p>
            ))}
            <p>
              <span className="font-medium text-zinc-800">Price:</span> INR{" "}
              {listing.price_per_month.toLocaleString("en-IN")} / month
            </p>
            <p>
              <span className="font-medium text-zinc-800">Minimum Agreement:</span>{" "}
              {listing.min_agreement_months} {listing.min_agreement_months === 1 ? "month" : "months"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 pt-4">
          <p className="text-xs font-mono text-zinc-500">Listing ID: {listing.listing_id}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
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
