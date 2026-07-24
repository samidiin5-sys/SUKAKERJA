create table public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  link_url text not null,
  keterangan text,
  created_at timestamptz not null default now()
);

create index task_submissions_task_idx on public.task_submissions(task_id);

alter table public.task_submissions enable row level security;

create policy "anggota_divisi_lihat_pengumpulan"
  on public.task_submissions for select
  using (
    exists (
      select 1 from public.tasks t
      join public.boards b on b.id = t.board_id
      where t.id = task_submissions.task_id
      and public.is_division_member(b.division_id)
    )
  );
