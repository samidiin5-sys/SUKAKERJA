-- Fase 2: Divisi, Board, Task.
-- Prinsip: RLS di sini HANYA mengatur SELECT (baca). Seluruh operasi tulis
-- (insert/update/delete) dilakukan lewat Server Action memakai service_role
-- client, dengan pengecekan izin eksplisit di kode (src/lib/auth/otorisasi.ts).
-- Ini pola yang sama dipakai admin/karyawan setelah bug RLS di Fase 1.

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  deskripsi text,
  warna text not null default '#7a2b1c',
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.division_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  division_id uuid not null references public.divisions(id) on delete cascade,
  role text not null default 'staff' check (role in ('manajer_divisi', 'staff', 'viewer')),
  joined_at timestamptz not null default now(),
  unique (user_id, division_id)
);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  nama text not null,
  urutan integer not null default 0,
  is_completion_board boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (division_id, nama)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  judul text not null,
  deskripsi text,
  prioritas text not null default 'sedang' check (prioritas in ('rendah', 'sedang', 'tinggi', 'mendesak')),
  due_date timestamptz,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  urutan integer not null default 0,
  created_by uuid not null references public.profiles(id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create index idx_division_members_user on public.division_members(user_id);
create index idx_boards_division on public.boards(division_id);
create index idx_tasks_board on public.tasks(board_id);
create index idx_task_assignees_user on public.task_assignees(user_id);
create index idx_task_assignees_task on public.task_assignees(task_id);

-- Fungsi bantu: apakah user saat ini anggota divisi tertentu (atau Super Admin).
create or replace function public.is_division_member(cek_division_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_super_admin()
    or exists (
      select 1 from public.division_members
      where division_id = cek_division_id and user_id = auth.uid()
    );
$$;

-- Fungsi bantu: divisi tempat sebuah board berada, dipakai kebijakan RLS tasks.
create or replace function public.is_board_division_member(cek_board_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_division_member(division_id)
  from public.boards
  where id = cek_board_id;
$$;

alter table public.divisions enable row level security;
alter table public.division_members enable row level security;
alter table public.boards enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;

create policy "lihat_divisi_jika_anggota"
  on public.divisions for select
  using (public.is_division_member(id));

create policy "lihat_anggota_jika_seDivisi"
  on public.division_members for select
  using (public.is_division_member(division_id));

create policy "lihat_board_jika_anggota"
  on public.boards for select
  using (public.is_division_member(division_id));

create policy "lihat_task_jika_anggota"
  on public.tasks for select
  using (public.is_board_division_member(board_id));

create policy "lihat_assignee_jika_anggota"
  on public.task_assignees for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
      and public.is_board_division_member(tasks.board_id)
    )
  );
