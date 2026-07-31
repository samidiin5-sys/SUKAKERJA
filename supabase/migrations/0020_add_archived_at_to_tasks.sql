-- Tambahkan kolom archived_at untuk mendukung arsip tugas selesai (sapu kolom selesai)
alter table public.tasks add column if not exists archived_at timestamptz;
