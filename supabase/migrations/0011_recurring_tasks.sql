-- 0011_recurring_tasks.sql
create type public.pola_ulang as enum (
  'daily_workday',
  'daily',
  'weekly',
  'monthly'
);

create table public.recurring_task_templates (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete restrict,
  judul text not null check (char_length(judul) <= 255),
  deskripsi text,
  prioritas text not null default 'sedang'
    check (prioritas in ('rendah', 'sedang', 'tinggi', 'mendesak')),
  assignee_ids uuid[] not null default '{}',
  pola pola_ulang not null,
  day_of_week integer check (day_of_week between 0 and 6),
  day_of_month integer check (day_of_month between 1 and 31),
  due_offset_hari integer not null default 0,
  tanggal_mulai date not null,
  tanggal_selesai date,
  is_active boolean not null default true,
  last_generated_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index recurring_templates_division_idx
  on public.recurring_task_templates(division_id)
  where deleted_at is null;

create trigger recurring_task_templates_updated_at
  before update on public.recurring_task_templates
  for each row execute function public.set_updated_at();

alter table public.recurring_task_templates enable row level security;

create policy "anggota_divisi_lihat_template_rutin"
  on public.recurring_task_templates for select
  using (public.is_division_member(division_id));
