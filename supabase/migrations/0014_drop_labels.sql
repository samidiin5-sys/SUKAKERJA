-- 0014_drop_labels.sql
-- Fitur Label dihapus dari aplikasi (tidak dipakai lagi, prioritas task sudah cukup).
-- Aman dihapus: task_labels sudah tidak direferensikan kode manapun.
drop table if exists public.task_labels;
drop table if exists public.labels;
