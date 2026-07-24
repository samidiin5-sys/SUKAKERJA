-- Fase 3: Komentar pada task.
-- Sama seperti divisions/boards/tasks, RLS di sini hanya mengatur SELECT.
-- Insert/update/delete dilakukan lewat Server Action dengan service_role
-- client + pengecekan izin eksplisit (pastikanAnggotaDivisi).

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  isi text not null,
  is_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_comments_task on public.comments(task_id);

alter table public.comments enable row level security;

create policy "lihat_komentar_jika_anggota_divisi"
  on public.comments for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = comments.task_id
      and public.is_board_division_member(tasks.board_id)
    )
  );
