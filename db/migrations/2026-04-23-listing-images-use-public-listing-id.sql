-- Move listing_images.listing_id from uuid (listing.id) to text (listing.listing_id).
-- Also normalize public listing ids by removing ':' if present.

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

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'listing_images'
  ) then
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing_images'
      and column_name = 'listing_id'
      and udt_name = 'uuid'
  ) then
    alter table public.listing_images
      add column if not exists listing_public_id text;

    update public.listing_images li
    set listing_public_id = l.listing_id
    from public.listing l
    where li.listing_public_id is null
      and l.id = li.listing_id;

    alter table public.listing_images
      drop constraint if exists listing_images_listing_id_fkey;

    alter table public.listing_images
      drop constraint if exists listing_images_unique_order_per_listing;

    drop index if exists public.listing_images_listing_idx;

    alter table public.listing_images
      drop column if exists listing_id;

    alter table public.listing_images
      rename column listing_public_id to listing_id;
  end if;
end
$$;

alter table if exists public.listing_images
  alter column listing_id set not null;

alter table if exists public.listing_images
  drop constraint if exists listing_images_listing_id_fkey;

alter table if exists public.listing_images
  add constraint listing_images_listing_id_fkey
  foreign key (listing_id) references public.listing (listing_id) on delete cascade;

alter table if exists public.listing_images
  drop constraint if exists listing_images_unique_order_per_listing;

alter table if exists public.listing_images
  add constraint listing_images_unique_order_per_listing unique (listing_id, sort_order);

create index if not exists listing_images_listing_idx
  on public.listing_images (listing_id);
