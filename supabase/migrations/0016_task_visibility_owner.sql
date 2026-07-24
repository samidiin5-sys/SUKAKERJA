-- 0016_task_visibility_owner.sql
-- Owner bisa mengirim tugas dan men-tag staff tertentu. Task yang dikirim
-- lewat alur ini cuma boleh dilihat staff yang di-tag (+ Super Admin/Owner),
-- bukan seluruh anggota divisi seperti task papan Kanban biasa.
alter table public.tasks
  add column if not exists hanya_assignee boolean not null default false;
