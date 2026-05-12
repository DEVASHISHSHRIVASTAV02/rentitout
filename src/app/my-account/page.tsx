import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, MoreVertical } from "lucide-react";
import { ensureProfile, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { deleteListingAction, toggleListingStatusAction } from "@/app/actions";
import { ListingImageCarousel } from "@/components/listing-image-carousel";
import { MyAccountHeaderActions } from "@/components/my-account-header-actions";
import { Alert } from "@/components/ui/alert";
import { getListingDetailFields } from "@/lib/listing-details";
import { buildPageMetadata } from "@/lib/seo";

interface MyAccountPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = buildPageMetadata({
  title: "My Account",
  description: "Manage your profile and appliance listings.",
  path: "/my-account",
  noIndex: true,
});

interface MyAccountListing {
  id: string;
  listing_id: string;
  category: string;
  sub_category: string | null;
  item_info: string | null;
  price_per_month: number;
  min_agreement_months: number;
  image_urls: string[];
  city: string;
  pincode: string;
  is_active: boolean;
  created_at: string;
}

export default async function MyAccountPage({ searchParams }: MyAccountPageProps) {
  const queryParams = await searchParams;
  const message = typeof queryParams.message === "string" ? queryParams.message : "";
  const error = typeof queryParams.error === "string" ? queryParams.error : "";

  const user = await requireUser();
  await ensureProfile(user);

  const { rows } = await query<MyAccountListing>(
    `
      select
        l.id,
        l.listing_id,
        l.category,
        l.sub_category,
        l.item_info,
        l.price_per_month,
        l.min_agreement_months,
        coalesce(images.image_urls, '{}'::text[]) as image_urls,
        l.city,
        l.pincode,
        l.is_active,
        l.created_at::text
      from listing l
      left join lateral (
        select array_agg(li.image_url order by li.sort_order) as image_urls
        from listing_images li
        where li.listing_id = l.listing_id
      ) images on true
      where l.owner_id = $1
      order by l.created_at desc
    `,
    [user.id],
  );

  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">My Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">List Items and Manage Listings.</h1>
        </div>
        <MyAccountHeaderActions defaultContactEmail={user.email ?? ""} />
      </div>

      {message ? <Alert message={message} type="success" /> : null}
      {error ? <Alert message={error} type="error" /> : null}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-zinc-950">My Listed Items</h2>
        {rows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {rows.map((listing) => {
              const detailFields = getListingDetailFields({
                category: listing.category,
                subCategory: listing.sub_category,
                itemInfo: listing.item_info,
              });

              return (
                <article
                  key={listing.id}
                  className="flex h-full min-w-0 flex-col rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <ListingImageCarousel
                      images={listing.image_urls}
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
                          INR {listing.price_per_month.toLocaleString("en-IN")} / month
                        </p>
                        <p className="break-words text-xs text-zinc-600">
                          Minimum agreement: {listing.min_agreement_months}{" "}
                          {listing.min_agreement_months === 1 ? "month" : "months"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-2 py-1 text-xs ${
                          listing.is_active
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-zinc-300 bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {listing.is_active ? "Active" : "Delisted"}
                      </span>
                    </div>

                    <p className="break-all text-xs font-mono text-zinc-500">Listing ID: {listing.listing_id}</p>
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
                          <Link
                            href={`/my-account/edit/${listing.id}`}
                            className="block rounded-lg px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
                          >
                            Edit
                          </Link>

                          <form action={toggleListingStatusAction}>
                            <input type="hidden" name="listingId" value={listing.id} />
                            <input type="hidden" name="isActive" value={String(listing.is_active)} />
                            <button
                              type="submit"
                              className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                            >
                              {listing.is_active ? "Delist" : "Relist"}
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
        ) : (
          <p className="text-sm text-zinc-600">No listings yet.</p>
        )}
      </section>
    </div>
  );
}
