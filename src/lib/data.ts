import { query } from "@/lib/db";
import {
  type ApplianceListing,
  type Profile,
  type PublicApplianceListing,
  type PublicListingSortOrder,
} from "@/lib/types";

export interface ListingFilters {
  city?: string;
  category?: string;
  subCategory?: string;
  itemInfo?: string;
  listingId?: string;
  pincode?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minAgreementMonths?: number;
  sortBy?: PublicListingSortOrder;
  page?: number;
  pageSize?: number;
}

export interface ListingByIdResult {
  listing: ApplianceListing;
  owner: Profile | null;
}

export interface PublicListingsPageResult {
  listings: PublicApplianceListing[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

declare global {
  var __RentItOutPublicListingsCache: Map<string, CacheEntry<PublicListingsPageResult>> | undefined;
  var __RentItOutListingByIdCache: Map<string, CacheEntry<ListingByIdResult | null>> | undefined;
  var __RentItOutListingImagesByIdCache: Map<string, CacheEntry<string[]>> | undefined;
}

const DEFAULT_PUBLIC_LISTINGS_CACHE_TTL_MS = 120000;
const DEFAULT_LISTING_BY_ID_CACHE_TTL_MS = 120000;
const DEFAULT_IN_MEMORY_CACHE_MAX_ENTRIES = 300;
const DEFAULT_PUBLIC_LISTINGS_PAGE_SIZE = 18;
const MAX_PUBLIC_LISTINGS_PAGE_SIZE = 60;
const MIN_EFFECTIVE_CACHE_TTL_MS = 1000;

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function readCacheTtlMs(value: string | undefined, fallback: number) {
  // Keep cache effectively enabled even if an env var is set too low by mistake.
  return Math.max(readPositiveInt(value, fallback), MIN_EFFECTIVE_CACHE_TTL_MS);
}

function getPublicListingsCache() {
  if (!global.__RentItOutPublicListingsCache) {
    global.__RentItOutPublicListingsCache = new Map<string, CacheEntry<PublicListingsPageResult>>();
  }
  return global.__RentItOutPublicListingsCache;
}

function getListingByIdCache() {
  if (!global.__RentItOutListingByIdCache) {
    global.__RentItOutListingByIdCache = new Map<string, CacheEntry<ListingByIdResult | null>>();
  }
  return global.__RentItOutListingByIdCache;
}

function getListingImagesByIdCache() {
  if (!global.__RentItOutListingImagesByIdCache) {
    global.__RentItOutListingImagesByIdCache = new Map<string, CacheEntry<string[]>>();
  }
  return global.__RentItOutListingImagesByIdCache;
}

function readFromCache<T>(store: Map<string, CacheEntry<T>>, key: string): T | null {
  const cached = store.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return cached.value;
}

function pruneCache<T>(store: Map<string, CacheEntry<T>>, maxEntries: number) {
  if (store.size <= maxEntries) {
    return;
  }

  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= now) {
      store.delete(key);
    }
    if (store.size <= maxEntries) {
      return;
    }
  }

  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) {
      return;
    }
    store.delete(oldestKey);
  }
}

function writeToCache<T>(
  store: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
  maxEntries: number,
) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  pruneCache(store, maxEntries);
}

function buildPublicListingsCacheKey(filters: ListingFilters) {
  return JSON.stringify({
    city: filters.city ?? "",
    category: filters.category ?? "",
    subCategory: filters.subCategory ?? "",
    itemInfo: filters.itemInfo ?? "",
    listingId: filters.listingId ?? "",
    pincode: filters.pincode ?? "",
    q: filters.q ?? "",
    minPrice: filters.minPrice ?? null,
    maxPrice: filters.maxPrice ?? null,
    minAgreementMonths: filters.minAgreementMonths ?? null,
    sortBy: filters.sortBy ?? "",
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? DEFAULT_PUBLIC_LISTINGS_PAGE_SIZE,
  });
}

export function clearPublicListingsCache() {
  getPublicListingsCache().clear();
}

export function clearListingByIdCache(listingId?: string) {
  const store = getListingByIdCache();
  const imageStore = getListingImagesByIdCache();
  if (!listingId) {
    store.clear();
    imageStore.clear();
    return;
  }
  store.delete(listingId);
  imageStore.delete(listingId);
}

function parsePincodeFilter(value: string) {
  return value
    .split(/\s+/)
    .map((entry) => entry.replace(/\D/g, "").slice(0, 6))
    .filter((entry) => entry.length === 6)
    .slice(0, 5);
}

function normalizePage(value: number | undefined) {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 1;
  }
  return value;
}

function normalizePageSize(value: number | undefined) {
  if (!Number.isInteger(value) || !value || value < 1) {
    return DEFAULT_PUBLIC_LISTINGS_PAGE_SIZE;
  }
  return Math.min(value, MAX_PUBLIC_LISTINGS_PAGE_SIZE);
}

export async function getPublicListings(filters: ListingFilters = {}): Promise<PublicListingsPageResult> {
  const publicListingsCacheTtlMs = readCacheTtlMs(
    process.env.PUBLIC_LISTINGS_CACHE_TTL_MS,
    DEFAULT_PUBLIC_LISTINGS_CACHE_TTL_MS,
  );
  const inMemoryCacheMaxEntries = readPositiveInt(
    process.env.IN_MEMORY_CACHE_MAX_ENTRIES,
    DEFAULT_IN_MEMORY_CACHE_MAX_ENTRIES,
  );
  const requestedPage = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);
  const publicListingsCacheKey = buildPublicListingsCacheKey({
    ...filters,
    page: requestedPage,
    pageSize,
  });
  const cached = readFromCache(getPublicListingsCache(), publicListingsCacheKey);
  if (cached) {
    return cached;
  }

  const whereClauses: string[] = ["l.is_active = true"];
  const values: unknown[] = [];
  let index = 1;

  if (filters.city) {
    whereClauses.push(`lower(l.city) = lower($${index++})`);
    values.push(filters.city.trim());
  }
  if (filters.category && filters.category !== "All") {
    whereClauses.push(`l.category = $${index++}`);
    values.push(filters.category);
  }
  if (filters.subCategory?.trim()) {
    whereClauses.push(`lower(l.sub_category) = lower($${index++})`);
    values.push(filters.subCategory.trim());
  }
  if (filters.itemInfo?.trim()) {
    whereClauses.push(`l.item_info ilike $${index++}`);
    values.push(`%${filters.itemInfo.trim()}%`);
  }
  if (filters.listingId) {
    whereClauses.push(`upper(l.listing_id) = upper($${index++})`);
    values.push(filters.listingId.trim());
  }
  if (filters.pincode?.trim()) {
    const selectedPincodes = parsePincodeFilter(filters.pincode);
    if (selectedPincodes.length > 0) {
      whereClauses.push(`l.pincode = any($${index++}::text[])`);
      values.push(selectedPincodes);
    }
  }
  if (filters.q) {
    whereClauses.push(`(l.category ilike $${index} or l.city ilike $${index + 1} or l.pincode ilike $${index + 2})`);
    values.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
    index += 3;
  }
  if (typeof filters.minPrice === "number" && Number.isFinite(filters.minPrice)) {
    whereClauses.push(`l.price_per_month >= $${index++}`);
    values.push(filters.minPrice);
  }
  if (typeof filters.maxPrice === "number" && Number.isFinite(filters.maxPrice)) {
    whereClauses.push(`l.price_per_month <= $${index++}`);
    values.push(filters.maxPrice);
  }
  if (typeof filters.minAgreementMonths === "number" && Number.isFinite(filters.minAgreementMonths)) {
    whereClauses.push(`l.min_agreement_months >= $${index++}`);
    values.push(filters.minAgreementMonths);
  }

  const orderByClause =
    filters.sortBy === "price_low_to_high"
      ? "l.price_per_month asc, l.created_at desc"
      : filters.sortBy === "price_high_to_low"
        ? "l.price_per_month desc, l.created_at desc"
        : filters.sortBy === "date_oldest"
          ? "l.created_at asc"
          : "l.created_at desc";
  const whereClauseSql = whereClauses.join(" and ");
  const limitPlaceholder = `$${values.length + 1}`;
  const offsetPlaceholder = `$${values.length + 2}`;
  const listingSelectSql = `
    select
      l.id,
      l.listing_id,
      l.owner_id,
      l.category,
      l.sub_category,
      l.item_info,
      l.price_per_month,
      l.min_agreement_months,
      l.city,
      l.pincode,
      l.is_active,
      l.created_at,
      l.updated_at,
      case
        when thumbnail.image_url is null then '{}'::text[]
        else array[thumbnail.image_url]
      end as image_urls
    from listing l
    left join lateral (
      select li.image_url
      from listing_images li
      where li.listing_id = l.listing_id
      order by li.sort_order
      limit 1
    ) thumbnail on true
    where ${whereClauseSql}
    order by ${orderByClause}
    limit ${limitPlaceholder}
    offset ${offsetPlaceholder}
  `;

  let rows: PublicApplianceListing[] = [];
  let totalCount = 0;
  let totalPages = 1;
  let page = requestedPage;

  if (requestedPage === 1) {
    const requestedOffset = 0;
    const requestedPaginationValues = [...values, pageSize, requestedOffset];
    const [countResult, listingResult] = await Promise.all([
      query<{ total_count: string }>(
        `
          select count(*)::text as total_count
          from listing l
          where ${whereClauseSql}
        `,
        values,
      ),
      query<PublicApplianceListing>(listingSelectSql, requestedPaginationValues),
    ]);

    totalCount = Number.parseInt(countResult.rows[0]?.total_count ?? "0", 10) || 0;
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    page = Math.min(requestedPage, totalPages);
    rows = totalCount > 0 ? listingResult.rows : [];
  } else {
    const { rows: countRows } = await query<{ total_count: string }>(
      `
        select count(*)::text as total_count
        from listing l
        where ${whereClauseSql}
      `,
      values,
    );
    totalCount = Number.parseInt(countRows[0]?.total_count ?? "0", 10) || 0;
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    page = Math.min(requestedPage, totalPages);

    if (totalCount > 0) {
      const offset = (page - 1) * pageSize;
      const paginationValues = [...values, pageSize, offset];
      const listingResult = await query<PublicApplianceListing>(listingSelectSql, paginationValues);
      rows = listingResult.rows;
    }
  }

  const result: PublicListingsPageResult = {
    listings: rows,
    totalCount,
    page,
    pageSize,
    totalPages,
  };

  writeToCache(getPublicListingsCache(), publicListingsCacheKey, result, publicListingsCacheTtlMs, inMemoryCacheMaxEntries);
  return result;
}

export async function getPublicListingImagesById(id: string): Promise<string[] | null> {
  const listingByIdCacheTtlMs = readCacheTtlMs(
    process.env.LISTING_BY_ID_CACHE_TTL_MS,
    DEFAULT_LISTING_BY_ID_CACHE_TTL_MS,
  );
  const inMemoryCacheMaxEntries = readPositiveInt(
    process.env.IN_MEMORY_CACHE_MAX_ENTRIES,
    DEFAULT_IN_MEMORY_CACHE_MAX_ENTRIES,
  );
  const cached = readFromCache(getListingImagesByIdCache(), id);
  if (cached) {
    return cached;
  }

  const { rows } = await query<{ image_urls: string[] }>(
    `
      select
        coalesce(images.image_urls, '{}'::text[]) as image_urls
      from listing l
      left join lateral (
        select array_agg(li.image_url order by li.sort_order) as image_urls
        from listing_images li
        where li.listing_id = l.listing_id
      ) images on true
      where l.id::text = $1
        and l.is_active = true
      limit 1
    `,
    [id],
  );

  const imageUrls = rows[0]?.image_urls;
  if (!imageUrls) {
    return null;
  }

  const normalizedImageUrls = imageUrls
    .filter((imageUrl) => typeof imageUrl === "string")
    .map((imageUrl) => imageUrl.trim())
    .filter((imageUrl) => imageUrl.length > 0);

  writeToCache(
    getListingImagesByIdCache(),
    id,
    normalizedImageUrls,
    listingByIdCacheTtlMs,
    inMemoryCacheMaxEntries,
  );

  return normalizedImageUrls;
}

export async function getListingById(id: string): Promise<ListingByIdResult | null> {
  const listingByIdCacheTtlMs = readCacheTtlMs(
    process.env.LISTING_BY_ID_CACHE_TTL_MS,
    DEFAULT_LISTING_BY_ID_CACHE_TTL_MS,
  );
  const inMemoryCacheMaxEntries = readPositiveInt(
    process.env.IN_MEMORY_CACHE_MAX_ENTRIES,
    DEFAULT_IN_MEMORY_CACHE_MAX_ENTRIES,
  );
  const cached = readFromCache(getListingByIdCache(), id);
  if (cached) {
    return cached;
  }

  interface ListingByIdRow extends ApplianceListing {
    owner_profile_id: string | null;
    owner_full_name: string | null;
    owner_city: string | null;
    owner_phone: string | null;
    owner_email: string | null;
    owner_created_at: string | null;
  }

  const { rows } = await query<ListingByIdRow>(
    `
      select
        l.id,
        l.listing_id,
        l.owner_id,
        l.category,
        l.sub_category,
        l.item_info,
        l.price_per_month,
        l.min_agreement_months,
        l.contact_email,
        l.phone,
        l.city,
        l.pincode,
        l.is_active,
        l.created_at,
        l.updated_at,
        coalesce(images.image_urls, '{}'::text[]) as image_urls,
        p.id as owner_profile_id,
        p.full_name as owner_full_name,
        p.city as owner_city,
        case when p.show_phone_on_listing then p.phone else null end as owner_phone,
        case when p.show_email_on_listing then p.email::text else null end as owner_email,
        p.created_at::text as owner_created_at
      from listing l
      left join lateral (
        select array_agg(li.image_url order by li.sort_order) as image_urls
        from listing_images li
        where li.listing_id = l.listing_id
      ) images on true
      left join profiles p on p.id = l.owner_id
      where l.id::text = $1
      limit 1
    `,
    [id],
  );
  const row = rows[0];
  if (!row) {
    return null;
  }

  const result: ListingByIdResult = {
    listing: {
      id: row.id,
      listing_id: row.listing_id,
      owner_id: row.owner_id,
      category: row.category,
      sub_category: row.sub_category,
      item_info: row.item_info,
      price_per_month: row.price_per_month,
      min_agreement_months: row.min_agreement_months,
      contact_email: row.contact_email,
      phone: row.phone,
      city: row.city,
      pincode: row.pincode,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      image_urls: row.image_urls,
    },
    owner: row.owner_profile_id
      ? ({
          id: row.owner_profile_id,
          full_name: row.owner_full_name,
          city: row.owner_city,
          phone: row.owner_phone,
          email: row.owner_email,
          created_at: row.owner_created_at ?? "",
        } satisfies Profile)
      : null,
  };
  writeToCache(getListingByIdCache(), id, result, listingByIdCacheTtlMs, inMemoryCacheMaxEntries);
  return result;
}
