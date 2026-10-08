import type { Metadata } from "next";
import { ensureProfile, requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { MyAccountHeaderActions } from "@/components/my-account-header-actions";
import { MyAccountListings, type MyAccountListingCard } from "@/components/my-account-listings";
import { Alert } from "@/components/ui/alert";
import { type ListableItem, LISTABLE_ITEMS } from "@/lib/listable-items";
import { CATEGORY_ITEM_INFO_PRESET_OPTIONS, CATEGORY_SUBCATEGORY_OPTIONS } from "@/lib/listing-form-config";
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

interface MyAccountListingRow {
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
  contact_email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

function isListableItem(value: string): value is ListableItem {
  return LISTABLE_ITEMS.includes(value as ListableItem);
}

export default async function MyAccountPage({ searchParams }: MyAccountPageProps) {
  const queryParams = await searchParams;
  const message = typeof queryParams.message === "string" ? queryParams.message : "";
  const error = typeof queryParams.error === "string" ? queryParams.error : "";
  const shouldOpenNewListing = queryParams.newListing === "1";
  const autoEditListingId = typeof queryParams.edit === "string" ? queryParams.edit : "";

  const user = await requireUser();
  await ensureProfile(user);

  const { rows } = await query<MyAccountListingRow>(
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
        l.contact_email,
        l.phone,
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

  const listings: MyAccountListingCard[] = rows.flatMap((listing) => {
    if (!isListableItem(listing.category)) {
      return [];
    }

    const fallbackSubCategory = CATEGORY_SUBCATEGORY_OPTIONS[listing.category][0] ?? "General";
    const fallbackItemInfo = (CATEGORY_ITEM_INFO_PRESET_OPTIONS[listing.category] ?? [])[0] ?? "";

    return [
      {
        id: listing.id,
        listingPublicId: listing.listing_id,
        category: listing.category,
        subCategory: listing.sub_category ?? fallbackSubCategory,
        itemInfo: listing.item_info ?? fallbackItemInfo,
        pricePerMonth: listing.price_per_month,
        minAgreementMonths: listing.min_agreement_months,
        imageUrls: listing.image_urls.filter((entry) => typeof entry === "string" && entry.trim().length > 0),
        city: listing.city,
        pincode: listing.pincode,
        contactEmail: listing.contact_email ?? user.email ?? "",
        contactPhone: listing.phone,
        isActive: listing.is_active,
      },
    ];
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">My Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">List Items and Manage Listings.</h1>
        </div>
        <MyAccountHeaderActions defaultContactEmail={user.email ?? ""} autoOpenListing={shouldOpenNewListing} />
      </div>

      {message ? <Alert message={message} type="success" /> : null}
      {error ? <Alert message={error} type="error" /> : null}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-zinc-950">My Listed Items</h2>
        <MyAccountListings
          listings={listings}
          defaultContactEmail={user.email ?? ""}
          autoEditListingId={autoEditListingId}
        />
      </section>
    </div>
  );
}
