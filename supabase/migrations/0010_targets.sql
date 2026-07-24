-- 0010_targets.sql
-- Buat fungsi trigger updated_at yang dapat dipakai ulang oleh semua tabel.
-- Fungsi ini belum ada di migration sebelumnya (tabel lama update via service_role
-- di kode aplikasi), jadi didefinisikan di sini agar tersedia mulai migration ini.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.targets (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  periode_mulai date not null,
  periode_selesai date not null,
  jumlah_target integer not null check (jumlah_target > 0),
  keterangan text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint periode_valid check (periode_selesai > periode_mulai)
);

create index targets_division_user_idx on public.targets(division_id, user_id);
create index targets_periode_idx on public.targets(periode_mulai, periode_selesai);

create trigger targets_updated_at
  before update on public.targets
  for each row execute function public.set_updated_at();

alter table public.targets enable row level security;

create policy "anggota_divisi_lihat_target"
  on public.targets for select
  using (public.is_division_member(division_id));
