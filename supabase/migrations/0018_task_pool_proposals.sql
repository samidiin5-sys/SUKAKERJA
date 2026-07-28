-- 0018_task_pool_proposals.sql
-- Proposal pengambilan tugas pool: staff usulkan kapan bisa selesai,
-- owner approve/reject sebelum task resmi diassign.

create table public.task_pool_proposals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  deadline_diusulkan timestamptz not null,
  pesan text,
  status text not null default 'menunggu'
    check (status in ('menunggu', 'disetujui', 'ditolak')),
  catatan_owner text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create index idx_pool_proposals_task on public.task_pool_proposals(task_id);
create index idx_pool_proposals_user on public.task_pool_proposals(user_id);
create index idx_pool_proposals_status on public.task_pool_proposals(status) where status = 'menunggu';

alter table public.task_pool_proposals enable row level security;

create policy "lihat_proposal_sendiri"
  on public.task_pool_proposals for select
  using (user_id = auth.uid());
