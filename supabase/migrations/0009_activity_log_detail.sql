-- 0009_activity_log_detail.sql
alter table public.activity_log
  add column if not exists detail jsonb;

comment on column public.activity_log.detail is
  'Konteks tambahan untuk aksi tertentu, misal: { "old": "judul lama", "new": "judul baru" }';
