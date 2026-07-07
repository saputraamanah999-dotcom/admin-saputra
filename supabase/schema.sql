-- ===================================================================
-- SUPABASE SCHEMA — Wedding Invitation CMS
-- ===================================================================
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Copy seluruh file ini, paste, klik Run
--   3. Ulangi untuk tabel lain jika ada error
-- ===================================================================

-- ===== 1. SITES REGISTRY =====
-- Daftar semua site yang dikelola admin panel ini.
create table if not exists public.sites_registry (
  site_id text primary key,
  couple_names text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.sites_registry is 'Daftar site yang dikelola admin panel (site-1, site-2, dst)';

-- Seed 2 site default
insert into public.sites_registry (site_id, couple_names) values
  ('site-1', 'Wayan & Putri'),
  ('site-2', 'Made & Kadek')
on conflict (site_id) do nothing;

-- ===== 2. GUESTS =====
-- Daftar tamu resmi per site. Slug dipakai untuk URL ?to=slug.
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references public.sites_registry(site_id) on delete cascade,
  name text not null,
  slug text not null,
  invited_count integer not null default 1 check (invited_count >= 1 and invited_count <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (site_id, slug)
);

comment on table public.guests is 'Daftar tamu resmi per wedding site';
comment on column public.guests.slug is 'Slug untuk URL ?to=slug, unique per site';

create index if not exists idx_guests_site_id on public.guests(site_id);
create index if not exists idx_guests_slug on public.guests(site_id, slug);

-- ===== 3. VISIT_LOGS =====
-- Log kunjungan website tamu, dipakai untuk chart analytics harian.
create table if not exists public.visit_logs (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references public.sites_registry(site_id) on delete cascade,
  guest_slug text, -- nullable: tamu anonymous juga dihitung
  user_agent text,
  referrer text,
  visited_at timestamptz default now()
);

comment on table public.visit_logs is 'Log kunjungan website tamu untuk analytics';

create index if not exists idx_visit_logs_site_date on public.visit_logs(site_id, visited_at desc);
create index if not exists idx_visit_logs_slug on public.visit_logs(site_id, guest_slug);

-- ===== 4. ENABLE RLS (Row Level Security) =====
alter table public.sites_registry enable row level security;
alter table public.guests enable row level security;
alter table public.visit_logs enable row level security;

-- Policy: anon bisa SELECT sites_registry (untuk validasi siteId)
drop policy if exists "publik bisa lihat sites_registry" on public.sites_registry;
create policy "publik bisa lihat sites_registry"
  on public.sites_registry for select
  using (true);

-- Policy: anon bisa SELECT guests (website tamu cek slug)
drop policy if exists "publik bisa lihat guests by slug" on public.guests;
create policy "publik bisa lihat guests by slug"
  on public.guests for select
  using (true);

-- Policy: anon bisa INSERT visit_logs (website tamu log visit)
drop policy if exists "anon insert visit_logs" on public.visit_logs;
create policy "anon insert visit_logs"
  on public.visit_logs for insert
  with check (true);

-- Catatan: Untuk operasi write ke guests (insert/update/delete),
-- server pakai service_role key yang BYPASS RLS. Jadi tidak perlu policy tambahan.

-- ===== 5. TRIGGER updated_at =====
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_guests_updated_at on public.guests;
create trigger trigger_guests_updated_at
  before update on public.guests
  for each row execute function public.handle_updated_at();

drop trigger if exists trigger_sites_registry_updated_at on public.sites_registry;
create trigger trigger_sites_registry_updated_at
  before update on public.sites_registry
  for each row execute function public.handle_updated_at();

-- ===== 6. STORAGE BUCKET untuk gallery =====
-- Jalankan manual di Supabase Dashboard:
--   1. Storage → New bucket → Name: gallery, Public: ON
--   2. Policies → gallery → Add policy:
--      - SELECT: allow all (anon bisa baca)
--      - INSERT/UPDATE/DELETE: pakai service_role (admin dari server)

-- ===== SELESAI =====
-- Verifikasi:
--   select * from sites_registry;
--   select * from guests limit 5;
--   select * from visit_logs limit 5;
