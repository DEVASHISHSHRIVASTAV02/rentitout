import { ApplianceQuickButtons } from "@/components/appliance-quick-buttons";
import { BrowseFiltersForm } from "@/components/browse-filters-form";
import { ListingCard } from "@/components/listing-card";
import { SortSelectForm } from "@/components/sort-select-form";
import { Alert } from "@/components/ui/alert";
import { getPublicListings } from "@/lib/data";

const SORT_OPTIONS = ["price_low_to_high", "price_high_to_low"] as const;

interface BrowsePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
  const message = typeof query.message === "string" ? query.message : "";
  const error = typeof query.error === "string" ? query.error : "";

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

  const listings = await getPublicListings({
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
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl min-w-0 space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Browse</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 sm:text-3xl">Find Appliances to Rent</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Filter by category, subcategory, item info, city, listing ID, pincodes, cost per month, and agreement duration.
        </p>
      </div>

      {message ? <Alert message={message} type="success" /> : null}
      {error ? <Alert message={error} type="error" /> : null}

      <ApplianceQuickButtons />

      <section className="grid min-w-0 gap-4 lg:grid-cols-4 lg:items-start">
        <aside className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 lg:sticky lg:top-24">
          <BrowseFiltersForm
            key={[
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
            ].join("|")}
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
          <div className="mb-3 flex justify-start sm:justify-end">
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
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-zinc-600">
              No listings matched your filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
