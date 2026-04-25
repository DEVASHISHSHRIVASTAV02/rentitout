-- Listing core table.
-- Includes category/sub-category, item info, image links, location, and listing contact details.

create table if not exists public.listing (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null unique,
  owner_id uuid not null references public.users (id) on delete cascade,
  category text not null
    check (
      category in ('AC', 'Bed', 'Cooler', 'Fridge', 'Geyser', 'Mattress', 'Washing Machine', 'Water Purifier')
    ),
  sub_category text,
  item_info text,
  price_per_month integer not null,
  min_agreement_months integer not null,
  city text not null,
  pincode text not null check (pincode ~ '^\d{6}$'),
  contact_email citext not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_listing_id_not_blank check (btrim(listing_id) <> ''),
  constraint listing_sub_category_not_blank check (sub_category is null or btrim(sub_category) <> ''),
  constraint listing_item_info_not_blank check (item_info is null or btrim(item_info) <> ''),
  constraint listing_price_per_month_positive check (price_per_month >= 1),
  constraint listing_min_agreement_months_range check (min_agreement_months between 1 and 24),
  constraint listing_phone_length check (phone is null or char_length(btrim(phone)) between 8 and 20)
);

drop trigger if exists listing_set_updated_at on public.listing;
create trigger listing_set_updated_at
before update on public.listing
for each row
execute procedure public.set_updated_at();

create index if not exists listing_owner_idx on public.listing (owner_id);
create index if not exists listing_city_idx on public.listing (city);
create index if not exists listing_category_idx on public.listing (category);
create index if not exists listing_active_idx on public.listing (is_active);
create index if not exists listing_email_idx on public.listing (contact_email);
create index if not exists listing_pincode_idx on public.listing (pincode);
create index if not exists listing_price_per_month_idx on public.listing (price_per_month);
create index if not exists listing_min_agreement_months_idx on public.listing (min_agreement_months);

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
