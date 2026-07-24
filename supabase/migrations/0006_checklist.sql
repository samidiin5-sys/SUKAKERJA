-- Milestone: Checklist pada Task.
-- Sama seperti tabel lain, RLS di sini hanya mengatur SELECT.
-- Insert/update/delete dilakukan lewat Server Action dengan service_role
-- client + pengecekan izin eksplisit (pastikanAnggotaDivisi).

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  isi text not null,
  selesai boolean not null default false,
  urutan integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_checklist_items_task on public.checklist_items(task_id);

alter table public.checklist_items enable row level security;

create policy "lihat_checklist_jika_anggota_divisi"
  on public.checklist_items for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = checklist_items.task_id
      and public.is_board_division_member(tasks.board_id)
    )
  );
