import { query } from "@/lib/db";
import { type ApplianceListing, type Profile, type PublicApplianceListing } from "@/lib/types";

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
  sortBy?: "price_low_to_high" | "price_high_to_low";
}

function parsePincodeFilter(value: string) {
  return value
    .split(/\s+/)
    .map((entry) => entry.replace(/\D/g, "").slice(0, 6))
    .filter((entry) => entry.length === 6)
    .slice(0, 5);
}

export async function getPublicListings(filters: ListingFilters = {}): Promise<PublicApplianceListing[]> {
  const whereClauses: string[] = ["l.is_active = true"];
  const values: unknown[] = [];
  let index = 1;

  if (filters.city) {
    whereClauses.push(`l.city ilike $${index++}`);
    values.push(`%${filters.city}%`);
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
        : "l.created_at desc";

  const { rows } = await query<PublicApplianceListing>(
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
        l.city,
        l.pincode,
        l.is_active,
        l.created_at,
        l.updated_at,
        coalesce(images.image_urls, '{}'::text[]) as image_urls
      from listing l
      left join lateral (
        select array_agg(li.image_url order by li.sort_order) as image_urls
        from listing_images li
        where li.listing_id = l.listing_id
      ) images on true
      where ${whereClauses.join(" and ")}
      order by ${orderByClause}
    `,
    values,
  );

  return rows;
}

export async function getListingById(id: string) {
  const { rows: listingRows } = await query<ApplianceListing>(
    `
      select
        l.*,
        coalesce(images.image_urls, '{}'::text[]) as image_urls
      from listing l
      left join lateral (
        select array_agg(li.image_url order by li.sort_order) as image_urls
        from listing_images li
        where li.listing_id = l.listing_id
      ) images on true
      where l.id::text = $1
      limit 1
    `,
    [id],
  );
  const listing = listingRows[0];
  if (!listing) {
    return null;
  }

  const { rows: ownerRows } = await query<Profile>(
    `
      select
        id,
        full_name,
        city,
        case when show_phone_on_listing then phone else null end as phone,
        case when show_email_on_listing then email else null end as email,
        created_at::text
      from profiles
      where id = $1
      limit 1
    `,
    [listing.owner_id],
  );

  return {
    listing,
    owner: ownerRows[0] ?? null,
  };
}
