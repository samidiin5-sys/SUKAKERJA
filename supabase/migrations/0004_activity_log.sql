-- Fase 3: Activity Log.
-- Catatan tidak bisa diubah/dihapus lewat aplikasi (tidak ada policy
-- update/delete sama sekali, dan RLS hanya mengizinkan SELECT).
-- Insert hanya lewat service_role client (fungsi catatAktivitas di server).

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  actor_nama text not null,
  jenis_aktivitas text not null,
  objek_tipe text not null,
  objek_id uuid,
  objek_nama text not null,
  division_id uuid references public.divisions(id),
  created_at timestamptz not null default now()
);

create index idx_activity_log_objek on public.activity_log(objek_tipe, objek_id);
create index idx_activity_log_division on public.activity_log(division_id);
create index idx_activity_log_created on public.activity_log(created_at desc);

alter table public.activity_log enable row level security;

create policy "lihat_log_jika_anggota_divisi_atau_super_admin"
  on public.activity_log for select
  using (
    public.is_super_admin()
    or (division_id is not null and public.is_division_member(division_id))
  );
