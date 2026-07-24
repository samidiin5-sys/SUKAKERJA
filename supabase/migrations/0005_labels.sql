-- Milestone: Label pada Task.
-- Sama seperti tabel lain, RLS di sini hanya mengatur SELECT.
-- Insert/update/delete dilakukan lewat Server Action dengan service_role
-- client + pengecekan izin eksplisit (pastikanAnggotaDivisi/pastikanManajerDivisi).

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  nama text not null,
  warna text not null default '#7a2b1c',
  created_at timestamptz not null default now(),
  unique (division_id, nama)
);

create table public.task_labels (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  unique (task_id, label_id)
);

create index idx_labels_division on public.labels(division_id);
create index idx_task_labels_task on public.task_labels(task_id);
create index idx_task_labels_label on public.task_labels(label_id);

alter table public.labels enable row level security;
alter table public.task_labels enable row level security;

create policy "lihat_label_jika_anggota_divisi"
  on public.labels for select
  using (public.is_division_member(division_id));

create policy "lihat_task_label_jika_anggota_divisi"
  on public.task_labels for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
      and public.is_board_division_member(tasks.board_id)
    )
  );
