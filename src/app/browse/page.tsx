import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Filter, Search } from "lucide-react";
import { ApplianceQuickButtons } from "@/components/appliance-quick-buttons";
import { AccountCreatedPopup } from "@/components/account-created-popup";
import { BrowseFiltersForm } from "@/components/browse-filters-form";
import { ListingCard } from "@/components/listing-card";
import { SortSelectForm } from "@/components/sort-select-form";
import { Alert } from "@/components/ui/alert";
import { getPublicListings } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";

const SORT_OPTIONS = ["price_low_to_high", "price_high_to_low"] as const;
const BROWSE_PAGE_SIZE = 18;

interface BrowsePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: BrowsePageProps): Promise<Metadata> {
  const query = await searchParams;
  const city = typeof query.city === "string" && query.city !== "All Cities" ? query.city.trim() : "";
  const category = typeof query.category === "string" && query.category !== "All" ? query.category.trim() : "";

  const title =
    city && category
      ? `${category} Rentals in ${city}`
      : city
        ? `Appliance Rentals in ${city}`
        : category
          ? `${category} Rentals`
          : "Browse Appliance Listings";

  return buildPageMetadata({
    title,
    description:
      "Filter appliance listings by city, category, listing ID, pincode, monthly budget, and minimum agreement duration.",
    path: "/browse",
    keywords: [
      "browse rentals",
      "appliance filter search",
      city ? `${city} rentals` : "city rentals",
      category ? `${category} on rent` : "appliances on rent",
    ],
  });
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const query = await searchParams;
  const cityParam = typeof query.city === "string" ? query.city : "";
  const city = cityParam === "All Cities" ? "" : cityParam;
  const category = typeof query.category === "string" ? query.category : "All";
  const rawSubCategory = typeof query.subCategory === "string" ? query.subCategory.trim() : "";
  const rawItemInfo = typeof query.itemInfo === "string" ? query.itemInfo.trim() : "";
  const subCategory = category === "All" ? "" : rawSubCategory;
  const itemInfo = category === "All" ? "" : rawItemInfo;
  const rawPincode = query.pincode;
  const pincode =
    (Array.isArray(rawPincode) ? rawPincode.join(" ") : typeof rawPincode === "string" ? rawPincode : "")
      .split(/\s+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .slice(0, 5)
      .join(" ");
  const agreementMinParam = typeof query.agreementMin === "string" ? query.agreementMin : "";
  const parsedAgreementMin = Number(agreementMinParam);
  const agreementMin =
    Number.isInteger(parsedAgreementMin) && parsedAgreementMin >= 1 && parsedAgreementMin <= 24
      ? String(parsedAgreementMin)
      : "1";
  const sortParam = typeof query.sort === "string" ? query.sort : "price_low_to_high";
  const sortOrder = SORT_OPTIONS.includes(sortParam as (typeof SORT_OPTIONS)[number])
    ? (sortParam as (typeof SORT_OPTIONS)[number])
    : "price_low_to_high";
  const minPriceParam = typeof query.minPrice === "string" ? query.minPrice : "";
  const maxPriceParam = typeof query.maxPrice === "string" ? query.maxPrice : "";
  const listingIdParam = typeof query.listingId === "string" ? query.listingId : "";
  const listingId = listingIdParam.trim().toUpperCase();
  const pageParam = typeof query.page === "string" ? query.page : "1";
  const parsedPage = Number.parseInt(pageParam, 10);
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const message = typeof query.message === "string" ? query.message : "";
  const error = typeof query.error === "string" ? query.error : "";
  const normalizedMessage = message.trim().toLowerCase();
  const hasAccountCreatedMessage = normalizedMessage === "account created";
  const hasAccountDeletedMessage = normalizedMessage === "account deleted successfully";
  const nonPopupMessage = hasAccountCreatedMessage || hasAccountDeletedMessage ? "" : message;

  const parsedMinPrice = Number(minPriceParam);
  const parsedMaxPrice = Number(maxPriceParam);
  const minPrice =
    minPriceParam !== "" && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0 ? parsedMinPrice : undefined;
  const maxPrice =
    maxPriceParam !== "" && Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0 ? parsedMaxPrice : undefined;
  const normalizedMinPrice =
    minPrice !== undefined && maxPrice !== undefined ? Math.min(minPrice, maxPrice) : minPrice;
  const normalizedMaxPrice =
    minPrice !== undefined && maxPrice !== undefined ? Math.max(minPrice, maxPrice) : maxPrice;
  const minAgreementMonths = Number(agreementMin);

  const listingsPage = await getPublicListings({
    city,
    category,
    subCategory: subCategory || undefined,
    itemInfo: itemInfo || undefined,
    listingId: listingId || undefined,
    pincode: pincode || undefined,
    minPrice: normalizedMinPrice,
    maxPrice: normalizedMaxPrice,
    minAgreementMonths,
    sortBy: sortOrder,
    page: currentPage,
    pageSize: BROWSE_PAGE_SIZE,
  });
  const listings = listingsPage.listings;

  const buildPageHref = (targetPage: number) => {
    const baseParams = new URLSearchParams();
    for (const [key, rawValue] of Object.entries(query)) {
      if (key === "page" || key === "message" || key === "error") {
        continue;
      }
      if (Array.isArray(rawValue)) {
        for (const value of rawValue) {
          baseParams.append(key, value);
        }
        continue;
      }
      if (typeof rawValue === "string" && rawValue.trim().length > 0) {
        baseParams.set(key, rawValue);
      }
    }

    if (targetPage > 1) {
      baseParams.set("page", String(targetPage));
    } else {
      baseParams.delete("page");
    }

    const queryString = baseParams.toString();
    return queryString ? `/browse?${queryString}` : "/browse";
  };

  const hasPreviousPage = listingsPage.page > 1;
  const hasNextPage = listingsPage.page < listingsPage.totalPages;
  const firstVisibleIndex = listingsPage.totalCount === 0 ? 0 : (listingsPage.page - 1) * listingsPage.pageSize + 1;
  const lastVisibleIndex = Math.min(listingsPage.totalCount, listingsPage.page * listingsPage.pageSize);
  const filterFormKey = [
    sortOrder,
    category,
    subCategory,
    itemInfo,
    city,
    listingId,
    pincode,
    minPriceParam,
    maxPriceParam,
    agreementMin,
  ].join("|");

  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Browse</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">Find Appliances to Rent</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Filter by category, subcategory, item info, city, listing ID, pincodes, cost per month, and agreement duration.
        </p>
      </div>

      {hasAccountCreatedMessage ? <AccountCreatedPopup /> : null}
      {hasAccountDeletedMessage ? (
        <AccountCreatedPopup
          title="Account Deleted Successfully"
          description="Your account and all associated listings/info have been deleted permanently."
        />
      ) : null}
      {nonPopupMessage ? <Alert message={nonPopupMessage} type="success" /> : null}
      {error ? <Alert message={error} type="error" /> : null}

      <ApplianceQuickButtons />

      <section className="grid min-w-0 gap-4 lg:grid-cols-4 lg:items-start">
        <details className="group min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-700" />
              <span>Filter</span>
              <span className="text-zinc-400">&amp;</span>
              <Search className="h-4 w-4 text-zinc-700" />
              <span>Search</span>
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-600 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-zinc-200 p-4 sm:p-5">
            <BrowseFiltersForm
              key={`mobile-${filterFormKey}`}
              sortOrder={sortOrder}
              category={category}
              subCategory={subCategory}
              itemInfo={itemInfo}
              city={city}
              listingId={listingId}
              pincode={pincode}
              minPrice={minPriceParam}
              maxPrice={maxPriceParam}
              agreementMin={agreementMin}
              showHeader={false}
            />
          </div>
        </details>

        <aside className="hidden min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 lg:sticky lg:top-24 lg:block lg:rounded-r-none lg:border-t-0 lg:border-b-0 lg:border-l-0 lg:border-r-zinc-400">
          <BrowseFiltersForm
            key={`desktop-${filterFormKey}`}
            sortOrder={sortOrder}
            category={category}
            subCategory={subCategory}
            itemInfo={itemInfo}
            city={city}
            listingId={listingId}
            pincode={pincode}
            minPrice={minPriceParam}
            maxPrice={maxPriceParam}
            agreementMin={agreementMin}
          />
        </aside>

        <div className="min-w-0 lg:col-span-3">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Showing {firstVisibleIndex}-{lastVisibleIndex} of {listingsPage.totalCount}
            </p>
            <SortSelectForm
              city={city}
              category={category}
              subCategory={subCategory}
              itemInfo={itemInfo}
              listingId={listingId}
              pincode={pincode}
              minPrice={minPriceParam}
              maxPrice={maxPriceParam}
              agreementMin={agreementMin}
              sortOrder={sortOrder}
            />
          </div>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-zinc-600 sm:p-8">
              No listings matched your filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {listingsPage.totalCount > 0 ? (
            <nav
              aria-label="Pagination"
              className="mt-6 flex items-center justify-between gap-3"
            >
              <Link
                href={buildPageHref(listingsPage.page - 1)}
                className={[
                  "inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition sm:px-4",
                  hasPreviousPage ? "hover:bg-zinc-50" : "pointer-events-none opacity-50",
                ].join(" ")}
              >
                Previous
              </Link>
              <p className="text-center text-sm text-zinc-600">
                Page {listingsPage.page} of {listingsPage.totalPages}
              </p>
              <Link
                href={buildPageHref(listingsPage.page + 1)}
                className={[
                  "inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition sm:px-4",
                  hasNextPage ? "hover:bg-zinc-50" : "pointer-events-none opacity-50",
                ].join(" ")}
              >
                Next
              </Link>
            </nav>
          ) : null}
        </div>
      </section>
    </div>
  );
}
