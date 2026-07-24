-- 0013_tasks_deleted_by.sql
-- Menyimpan siapa yang menghapus task, dibutuhkan untuk halaman Data Terhapus
-- (REQ-040: tampilkan user yang menghapus).
alter table public.tasks
  add column if not exists deleted_by uuid references public.profiles(id);
