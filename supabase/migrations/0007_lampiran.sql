-- Milestone: Attachment (Lampiran) pada Task.
-- Bucket storage privat: seluruh akses (upload, unduh via signed URL, hapus)
-- dilakukan lewat Server Action dengan service_role client, sama seperti
-- pola tulis data lainnya di aplikasi ini. Tidak ada policy storage.objects
-- publik karena semua akses dimediasi lewat kode server.

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  nama_file text not null,
  path text not null,
  ukuran_bytes bigint not null,
  tipe_mime text,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_task_attachments_task on public.task_attachments(task_id);

alter table public.task_attachments enable row level security;

create policy "lihat_lampiran_jika_anggota_divisi"
  on public.task_attachments for select
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_attachments.task_id
      and public.is_board_division_member(tasks.board_id)
    )
  );
