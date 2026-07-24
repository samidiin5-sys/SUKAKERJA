-- Tabel profiles memperluas auth.users bawaan Supabase.
-- Lihat BRD Lampiran B.2.1 untuk rancangan lengkap entitas User.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  jabatan text,
  foto_url text,
  role_sistem text not null default 'user' check (role_sistem in ('super_admin', 'user')),
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  must_change_password boolean not null default true,
  failed_login_count integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.profiles is 'Data profil karyawan, memperluas auth.users bawaan Supabase';

-- Fungsi bantu: cek apakah user saat ini Super Admin.
-- security definer + dipisah jadi fungsi agar tidak memicu rekursi RLS
-- saat dipanggil dari dalam kebijakan tabel profiles itu sendiri.
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role_sistem = 'super_admin' and deleted_at is null
  );
$$;

alter table public.profiles enable row level security;

create policy "user_lihat_profil_sendiri"
  on public.profiles for select
  using (auth.uid() = id);

create policy "super_admin_lihat_semua_profil"
  on public.profiles for select
  using (public.is_super_admin());

create policy "super_admin_ubah_semua_profil"
  on public.profiles for update
  using (public.is_super_admin());

-- Trigger: otomatis buat baris profiles saat akun baru dibuat lewat Admin API (FR-USER-001).
-- Data nama/jabatan/role_sistem dikirim lewat user_metadata saat createUser dipanggil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama, jabatan, role_sistem, status, must_change_password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', ''),
    new.raw_user_meta_data->>'jabatan',
    coalesce(new.raw_user_meta_data->>'role_sistem', 'user'),
    'aktif',
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fungsi bantu: cari user id berdasarkan email.
-- Dipakai Server Action login (Task 6) untuk memeriksa status penguncian akun
-- SEBELUM memanggil signInWithPassword, sesuai NFR-SEC-008.
create or replace function public.get_user_id_by_email(cari_email text)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select id from auth.users where email = cari_email limit 1;
$$;
