-- Fitur: Notifikasi.
-- Sama seperti tabel lain, RLS di sini hanya mengatur SELECT.
-- Insert dan update (tandai dibaca) dilakukan lewat Server Action dengan
-- service_role client + pengecekan eksplisit user_id = sesi.id, sama
-- seperti pola pencatatan aktivitas.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  jenis text not null,
  pesan text not null,
  task_id uuid references public.tasks(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_user_unread on public.notifications(user_id) where is_read = false;

alter table public.notifications enable row level security;

create policy "lihat_notifikasi_sendiri"
  on public.notifications for select
  using (user_id = auth.uid());
