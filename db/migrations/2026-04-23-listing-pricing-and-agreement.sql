-- Add pricing and minimum-agreement fields to listing.
-- Backfills existing rows and enforces constraints.

alter table if exists public.listing
  add column if not exists price_per_month integer;

alter table if exists public.listing
  add column if not exists min_agreement_months integer;

update public.listing
set
  price_per_month = coalesce(price_per_month, 1),
  min_agreement_months = coalesce(min_agreement_months, 1)
where price_per_month is null
   or min_agreement_months is null;

alter table public.listing
  alter column price_per_month set not null;

alter table public.listing
  alter column min_agreement_months set not null;

alter table public.listing
  drop constraint if exists listing_price_per_month_positive;

alter table public.listing
  add constraint listing_price_per_month_positive
  check (price_per_month >= 1);

alter table public.listing
  drop constraint if exists listing_min_agreement_months_range;

alter table public.listing
  add constraint listing_min_agreement_months_range
  check (min_agreement_months between 1 and 24);

create index if not exists listing_price_per_month_idx
  on public.listing (price_per_month);

create index if not exists listing_min_agreement_months_idx
  on public.listing (min_agreement_months);
