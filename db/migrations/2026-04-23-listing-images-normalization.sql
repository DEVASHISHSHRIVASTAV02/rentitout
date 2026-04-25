-- Normalize listing images into a dedicated table.
-- Backfills legacy listing.image_urls and then removes that column.

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listing (listing_id) on delete cascade,
  image_url text not null check (btrim(image_url) <> ''),
  sort_order integer not null default 0 check (sort_order >= 0),
  mime_type text,
  file_size_bytes integer check (file_size_bytes is null or file_size_bytes > 0),
  created_at timestamptz not null default now(),
  constraint listing_images_unique_order_per_listing unique (listing_id, sort_order)
);

create index if not exists listing_images_listing_idx on public.listing_images (listing_id);
create index if not exists listing_images_created_at_idx on public.listing_images (created_at);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing'
      and column_name = 'image_urls'
  ) then
    insert into public.listing_images (listing_id, image_url, sort_order)
    select
      l.listing_id,
      entry.image_url,
      entry.ordinality - 1
    from public.listing l
    cross join lateral unnest(l.image_urls) with ordinality as entry(image_url, ordinality)
    where btrim(entry.image_url) <> ''
      and not exists (
        select 1
        from public.listing_images li
        where li.listing_id = l.listing_id
          and li.image_url = entry.image_url
      );

    alter table public.listing drop constraint if exists listing_image_count_limit;
    alter table public.listing drop column if exists image_urls;
  end if;
end
$$;
