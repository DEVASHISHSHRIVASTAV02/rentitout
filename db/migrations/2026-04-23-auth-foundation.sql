-- Fresh auth foundation migration.
-- Recreates only the data model requested so far:
-- users + profiles + sessions.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

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
