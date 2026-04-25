-- Rename listing.user_email to listing.contact_email.
-- Safe for reruns and mixed environments.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing'
      and column_name = 'user_email'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listing'
      and column_name = 'contact_email'
  ) then
    alter table public.listing rename column user_email to contact_email;
  end if;
end
$$;

create index if not exists listing_email_idx on public.listing (contact_email);
