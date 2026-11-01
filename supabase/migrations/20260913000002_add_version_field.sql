-- Add version field for optimistic locking
alter table public.student_progress add column if not exists version integer not null default 0;
