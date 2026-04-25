-- Add a human-readable public listing id.
-- Keeps uuid primary key for internal joins/routes and ownership checks.

alter table if exists public.listing
  add column if not exists listing_id text;

update public.listing
set listing_id = concat('LEG-', replace(id::text, '-', ''))
where listing_id is null;

update public.listing
set listing_id = replace(listing_id, ':', '')
where listing_id like '%:%';

alter table public.listing
  alter column listing_id set not null;

alter table public.listing
  drop constraint if exists listing_listing_id_not_blank;

alter table public.listing
  add constraint listing_listing_id_not_blank
  check (btrim(listing_id) <> '');

create unique index if not exists listing_listing_id_uidx
  on public.listing (listing_id);
