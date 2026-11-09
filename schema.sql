-- Uppersixth Memories database setup
-- Run this entire script in Supabase: SQL Editor -> New query -> Run.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_name text,
  memory_date date,
  media_type text not null check (media_type in ('image', 'video')),
  media_path text not null,
  published boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.memories enable row level security;

-- Visitors can read published memories only.
drop policy if exists "Public can view published memories" on public.memories;
create policy "Public can view published memories"
on public.memories for select
to anon, authenticated
using (published = true);

-- Only allowlisted administrators can add, edit or delete memories.
drop policy if exists "Admins can insert memories" on public.memories;
create policy "Admins can insert memories"
on public.memories for insert
to authenticated
with check (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  and created_by = auth.uid()
);

drop policy if exists "Admins can update memories" on public.memories;
create policy "Admins can update memories"
on public.memories for update
to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete memories" on public.memories;
create policy "Admins can delete memories"
on public.memories for delete
to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Admins can check their own allowlist status; no public listing of admins.
drop policy if exists "Admins can view own admin record" on public.admin_users;
create policy "Admins can view own admin record"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

-- Create a PUBLIC storage bucket for published gallery media.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-media', 'memory-media', true, 104857600,
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public visitors can list objects in the gallery bucket.
drop policy if exists "Public can view memory media" on storage.objects;
create policy "Public can view memory media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'memory-media');

-- Only administrators may upload or remove media.
drop policy if exists "Admins can upload memory media" on storage.objects;
create policy "Admins can upload memory media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'memory-media'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

drop policy if exists "Admins can delete memory media" on storage.objects;
create policy "Admins can delete memory media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'memory-media'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

-- IMPORTANT: After creating your admin account in Supabase Authentication,
-- copy that user's UUID and run this (replace the placeholder):
-- insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID');
