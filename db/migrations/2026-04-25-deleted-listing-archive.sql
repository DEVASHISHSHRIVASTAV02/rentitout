-- Archive deleted listings and their images so support can audit disputes later.

create table if not exists public.deleted_listing (
  id uuid primary key default gen_random_uuid(),
  original_listing_row_id uuid not null,
  original_listing_id text not null,
  owner_id uuid not null,
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
  was_active boolean not null default true,
  listing_created_at timestamptz not null,
  listing_updated_at timestamptz not null,
  deleted_by_user_id uuid not null,
  deleted_at timestamptz not null default now(),
  constraint deleted_listing_original_listing_id_not_blank check (btrim(original_listing_id) <> ''),
  constraint deleted_listing_sub_category_not_blank check (sub_category is null or btrim(sub_category) <> ''),
  constraint deleted_listing_item_info_not_blank check (item_info is null or btrim(item_info) <> ''),
  constraint deleted_listing_price_per_month_positive check (price_per_month >= 1),
  constraint deleted_listing_min_agreement_months_range check (min_agreement_months between 1 and 24),
  constraint deleted_listing_phone_length check (phone is null or char_length(btrim(phone)) between 8 and 20),
  constraint deleted_listing_deleted_after_listing_created check (deleted_at >= listing_created_at),
  constraint deleted_listing_deleted_after_listing_updated check (deleted_at >= listing_updated_at)
);

create unique index if not exists deleted_listing_original_row_uidx
  on public.deleted_listing (original_listing_row_id);
create index if not exists deleted_listing_original_listing_id_idx
  on public.deleted_listing (original_listing_id);
create index if not exists deleted_listing_owner_id_idx
  on public.deleted_listing (owner_id);
create index if not exists deleted_listing_deleted_by_user_id_idx
  on public.deleted_listing (deleted_by_user_id);
create index if not exists deleted_listing_deleted_at_idx
  on public.deleted_listing (deleted_at desc);

create table if not exists public.deleted_listing_images (
  id uuid primary key default gen_random_uuid(),
  deleted_listing_id uuid not null references public.deleted_listing (id) on delete cascade,
  original_image_url text not null check (btrim(original_image_url) <> ''),
  archived_image_url text not null check (btrim(archived_image_url) <> ''),
  sort_order integer not null default 0 check (sort_order >= 0),
  mime_type text,
  file_size_bytes integer check (file_size_bytes is null or file_size_bytes > 0),
  created_at timestamptz not null default now(),
  constraint deleted_listing_images_unique_order_per_listing unique (deleted_listing_id, sort_order)
);

create index if not exists deleted_listing_images_deleted_listing_idx
  on public.deleted_listing_images (deleted_listing_id);
create index if not exists deleted_listing_images_archived_image_url_idx
  on public.deleted_listing_images (archived_image_url);
