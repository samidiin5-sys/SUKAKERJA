-- Migration: 0021_add_task_bonus.sql
-- Description: Adds has_bonus and bonus_amount to public.tasks

alter table public.tasks
add column has_bonus boolean not null default false,
add column bonus_amount numeric not null default 0;
