-- 0019_task_target_scope.sql
-- Menambahkan kolom target_scope untuk menentukan apakah tugas terbuka
-- berlaku untuk 'semua' (lintas divisi) atau hanya 'divisi' (internal divisi)

alter table public.tasks
  add column if not exists target_scope text not null default 'semua'
  check (target_scope in ('semua', 'divisi'));

create index if not exists idx_tasks_pool_scope on public.tasks(is_pool_task, target_scope, created_at desc)
  where is_pool_task = true and deleted_at is null and completed_at is null;
