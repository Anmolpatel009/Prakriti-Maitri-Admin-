create table if not exists public.homepage_banners (
  id uuid primary key default gen_random_uuid(),
  slot integer not null unique
    check (slot between 1 and 4),
  image_url text not null,
  alt_text text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_banners_active_slot_idx
  on public.homepage_banners (is_active, slot);

alter table public.homepage_banners enable row level security;

drop policy if exists "Public can view active homepage banners"
on public.homepage_banners;

create policy "Public can view active homepage banners"
on public.homepage_banners
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can view homepage banners"
on public.homepage_banners;

create policy "Admins can view homepage banners"
on public.homepage_banners
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert homepage banners"
on public.homepage_banners;

create policy "Admins can insert homepage banners"
on public.homepage_banners
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update homepage banners"
on public.homepage_banners;

create policy "Admins can update homepage banners"
on public.homepage_banners
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete homepage banners"
on public.homepage_banners;

create policy "Admins can delete homepage banners"
on public.homepage_banners
for delete
to authenticated
using (public.is_admin());
