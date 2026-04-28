-- Run this file in Neon SQL Editor (or any PostgreSQL 15+ database).
-- Core auth schema requested by product requirements.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash text not null,
  full_name text,
  otp_request_count integer not null default 0 check (otp_request_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute procedure public.set_updated_at();

create table if not exists public.profiles (
  id uuid primary key references public.users (id) on delete cascade,
  email citext not null,
  full_name text,
  city text,
  phone text,
  show_email_on_listing boolean not null default true,
  show_phone_on_listing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_city_not_blank check (city is null or btrim(city) <> ''),
  constraint profiles_phone_length check (phone is null or char_length(btrim(phone)) between 8 and 20)
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create index if not exists profiles_email_idx on public.profiles (email);

do $$
begin
  create type public.otp_purpose as enum ('sign_in', 'password_reset');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  email citext not null,
  otp_hash text not null,
  purpose public.otp_purpose not null,
  requested_ip inet,
  requested_user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  constraint email_otps_expiry_after_create check (expires_at > created_at),
  constraint email_otps_consumed_after_create check (consumed_at is null or consumed_at >= created_at),
  constraint email_otps_attempt_count_lte_max check (attempt_count <= max_attempts)
);

create index if not exists email_otps_email_purpose_created_idx
on public.email_otps (email, purpose, created_at desc);
create index if not exists email_otps_user_purpose_created_idx
on public.email_otps (user_id, purpose, created_at desc);
create index if not exists email_otps_expiry_idx on public.email_otps (expires_at);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  session_token_hash text not null unique,
  ip_address inet,
  user_agent text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint sessions_expiry_after_create check (expires_at > created_at)
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_expires_at_idx on public.sessions (expires_at);
create index if not exists sessions_active_user_idx
on public.sessions (user_id, expires_at)
where revoked_at is null;

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
create index if not exists listing_active_created_at_idx on public.listing (is_active, created_at desc);
create index if not exists listing_email_idx on public.listing (contact_email);
create index if not exists listing_pincode_idx on public.listing (pincode);
create index if not exists listing_price_per_month_idx on public.listing (price_per_month);
create index if not exists listing_min_agreement_months_idx on public.listing (min_agreement_months);
create index if not exists listing_listing_id_upper_idx on public.listing ((upper(listing_id)));
create index if not exists listing_city_trgm_idx on public.listing using gin (city gin_trgm_ops);
create index if not exists listing_category_trgm_idx on public.listing using gin (category gin_trgm_ops);
create index if not exists listing_pincode_trgm_idx on public.listing using gin (pincode gin_trgm_ops);

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
