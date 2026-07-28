-- 0017_pool_task_lembur.sql
-- Fitur baru: task pool lintas divisi, alasan terlambat, pengajuan lembur

-- 1. Task pool: tugas bebas yang bisa diambil siapapun lintas divisi
alter table public.tasks
  add column if not exists is_pool_task boolean not null default false;

-- 2. Alasan terlambat: staff wajib isi saat task sudah melewati due_date
alter table public.tasks
  add column if not exists alasan_terlambat text;

-- 3. Tabel pengajuan lembur
create table public.lembur (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  division_id uuid not null references public.divisions(id) on delete cascade,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  alasan text not null check (char_length(alasan) >= 10),
  status text not null default 'menunggu'
    check (status in ('menunggu', 'disetujui', 'ditolak')),
  catatan_owner text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lembur_user on public.lembur(user_id, created_at desc);
create index idx_lembur_division on public.lembur(division_id);
create index idx_lembur_status on public.lembur(status) where status = 'menunggu';

alter table public.lembur enable row level security;

-- Staff hanya bisa lihat lembur milik sendiri
create policy "lihat_lembur_sendiri"
  on public.lembur for select
  using (user_id = auth.uid());

-- Index untuk task pool (query lintas divisi, hanya yang aktif)
create index idx_tasks_pool on public.tasks(is_pool_task, created_at desc)
  where is_pool_task = true and deleted_at is null and completed_at is null;
