-- 0015_owner_role.sql
-- Role "Manajer Divisi" diganti jadi "Owner" — dan sifatnya berubah dari
-- per-divisi jadi global (lintas semua divisi), sejajar dengan Super Admin
-- dari sisi cakupan (bukan dari sisi hak akses kelola akun).
-- Owner disimpan di profiles.role_sistem, BUKAN lagi di division_members.role.

-- 1. Longgarkan check constraint role_sistem agar menerima 'owner' dan 'staff'.
do $$
declare
  con text;
begin
  select conname into con
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and pg_get_constraintdef(oid) ilike '%role_sistem%';
  if con is not null then
    execute format('alter table public.profiles drop constraint %I', con);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_sistem_check
  check (role_sistem in ('super_admin', 'owner', 'staff', 'user'));

-- 2. Promosikan siapapun yang saat ini manajer_divisi di divisi manapun jadi Owner global.
update public.profiles p
set role_sistem = 'owner'
where exists (
  select 1 from public.division_members dm
  where dm.user_id = p.id and dm.role = 'manajer_divisi'
);

-- 3. Karena Owner sekarang global, hapus baris keanggotaan divisi yang rolenya manajer_divisi
--    (Owner tidak lagi "milik" satu divisi tertentu).
delete from public.division_members
where role = 'manajer_divisi';

-- 3b. Role Viewer dihapus dari aplikasi, semua anggota divisi jadi Staff.
update public.division_members set role = 'staff' where role = 'viewer';

-- 4. Perketat lagi check constraint division_members.role: cuma 'staff' yang tersisa.
do $$
declare
  con text;
begin
  select conname into con
  from pg_constraint
  where conrelid = 'public.division_members'::regclass
    and pg_get_constraintdef(oid) ilike '%role%';
  if con is not null then
    execute format('alter table public.division_members drop constraint %I', con);
  end if;
end $$;

alter table public.division_members
  add constraint division_members_role_check
  check (role in ('staff'));
