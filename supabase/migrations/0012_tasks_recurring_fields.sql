-- 0012_tasks_recurring_fields.sql
alter table public.tasks
  add column if not exists recurring_template_id uuid
    references public.recurring_task_templates(id) on delete set null,
  add column if not exists is_recurring boolean not null default false;

-- Index untuk optimasi query cron job (cek duplikasi task per template per tanggal)
create index tasks_recurring_template_idx
  on public.tasks(recurring_template_id, created_at)
  where recurring_template_id is not null;
