"use client";

import Link from "next/link";
import { MapPin, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { deleteListingAction, toggleListingStatusAction } from "@/app/actions";
import { EditListingPopup, type EditListingPopupValues } from "@/components/edit-listing-popup";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
import { getListingDetailFields } from "@/lib/listing-details";
import { type ListableItem } from "@/lib/listable-items";

export interface MyAccountListingCard {
  id: string;
  listingPublicId: string;
  category: ListableItem;
  subCategory: string;
  itemInfo: string;
  pricePerMonth: number;
  minAgreementMonths: number;
  imageUrls: string[];
  city: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string | null;
  isActive: boolean;
}

interface MyAccountListingsProps {
  listings: MyAccountListingCard[];
  defaultContactEmail: string;
  autoEditListingId?: string;
}

export function MyAccountListings({
  listings,
  defaultContactEmail,
  autoEditListingId = "",
}: MyAccountListingsProps) {
  const router = useRouter();

  const clearAutoEditQuery = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("edit")) {
      return;
    }
    params.delete("edit");
    const query = params.toString();
    router.replace(`/my-account${query ? `?${query}` : ""}`, { scroll: false });
  }, [router]);

  const autoEditId = useMemo(() => {
    if (!autoEditListingId) {
      return "";
    }
    return listings.some((listing) => listing.id === autoEditListingId) ? autoEditListingId : "";
  }, [autoEditListingId, listings]);

  if (listings.length === 0) {
    return <p className="text-sm text-zinc-600">No listings yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {listings.map((listing) => {
        const detailFields = getListingDetailFields({
          category: listing.category,
          subCategory: listing.subCategory,
          itemInfo: listing.itemInfo,
        });
        const editValues: EditListingPopupValues = {
          id: listing.id,
          listingPublicId: listing.listingPublicId,
          category: listing.category,
          subCategory: listing.subCategory,
          itemInfo: listing.itemInfo,
          pricePerMonth: listing.pricePerMonth,
          minAgreementMonths: listing.minAgreementMonths,
          city: listing.city,
          pincode: listing.pincode,
          contactEmail: listing.contactEmail,
          contactPhone: listing.contactPhone,
          imageUrls: listing.imageUrls,
        };

        return (
          <article
            key={listing.id}
            className="flex h-full min-w-0 flex-col rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-4 shadow-sm"
          >
            <div className="space-y-3">
              <ListingImageCarousel
                images={listing.imageUrls}
                alt={`${listing.category} listing`}
                className="border-zinc-200"
                imageContainerClassName="aspect-[16/11] sm:aspect-[4/3]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <Link href={`/listings/${listing.id}`} className="block">
                    <h3 className="break-words text-lg font-semibold text-zinc-900 hover:underline">
                      {listing.category}
                    </h3>
                  </Link>
                  {detailFields.map((field) => (
                    <p key={`${field.label}-${field.value}`} className="break-words text-sm text-zinc-700">
                      <span className="font-medium text-zinc-800">{field.label}:</span> {field.value}
                    </p>
                  ))}
                  <p className="break-words text-sm text-zinc-700">
                    INR {listing.pricePerMonth.toLocaleString("en-IN")} / month
                  </p>
                  <p className="break-words text-xs text-zinc-600">
                    Minimum agreement: {listing.minAgreementMonths}{" "}
                    {listing.minAgreementMonths === 1 ? "month" : "months"}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-2 py-1 text-xs ${
                    listing.isActive
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-zinc-300 bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {listing.isActive ? "Active" : "Delisted"}
                </span>
              </div>

              <p className="break-all text-xs font-mono text-zinc-500">Listing ID: {listing.listingPublicId}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="inline-flex items-center gap-1 text-sm text-zinc-600">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="break-words">
                    {listing.city} - PIN {listing.pincode}
                  </span>
                </p>

                <details className="relative self-end sm:self-auto">
                  <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
                    <MoreVertical className="h-4 w-4" />
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                    <EditListingPopup
                      listing={editValues}
                      defaultContactEmail={defaultContactEmail}
                      autoOpen={autoEditId === listing.id}
                      onAutoOpenConsumed={clearAutoEditQuery}
                    />

                    <form action={toggleListingStatusAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <input type="hidden" name="isActive" value={String(listing.isActive)} />
                      <button
                        type="submit"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                      >
                        {listing.isActive ? "Delist" : "Relist"}
                      </button>
                    </form>

                    <form action={deleteListingAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <button
                        type="submit"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
