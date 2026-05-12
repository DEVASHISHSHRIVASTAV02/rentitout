-- Browse query optimization indexes for common filters and sorting.
-- Targets active listings, city/category filters, and price sorting combinations.

create index if not exists listing_active_category_created_at_idx
  on public.listing (category, created_at desc)
  where is_active = true;

create index if not exists listing_active_city_lower_created_at_idx
  on public.listing ((lower(city)), created_at desc)
  where is_active = true;

create index if not exists listing_active_category_price_created_at_idx
  on public.listing (category, price_per_month, created_at desc)
  where is_active = true;

create index if not exists listing_active_city_lower_price_created_at_idx
  on public.listing ((lower(city)), price_per_month, created_at desc)
  where is_active = true;

create index if not exists listing_active_pincode_created_at_idx
  on public.listing (pincode, created_at desc)
  where is_active = true;

create index if not exists listing_active_sub_category_lower_idx
  on public.listing ((lower(sub_category)))
  where is_active = true and sub_category is not null;

create index if not exists listing_active_min_agreement_created_at_idx
  on public.listing (min_agreement_months, created_at desc)
  where is_active = true;

create index if not exists listing_item_info_trgm_idx
  on public.listing using gin (item_info gin_trgm_ops)
  where item_info is not null;
