-- Compatibility migration for auth/profile code paths.
-- Safe to run multiple times.

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

alter table if exists public.users
add column if not exists full_name text;

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

insert into public.profiles (id, email, full_name)
select u.id, u.email, u.full_name
from public.users u
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name);
