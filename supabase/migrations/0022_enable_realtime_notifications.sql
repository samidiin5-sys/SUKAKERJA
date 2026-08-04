-- 0022_enable_realtime_notifications.sql
-- Mengaktifkan publikasi real-time untuk tabel notifications agar client
-- dapat mendengarkan event perubahan data via websocket secara real-time.

alter publication supabase_realtime add table public.notifications;
