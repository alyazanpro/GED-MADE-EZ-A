-- GED MADE EZ — initial schema (migrated from local JSON stores)
-- Applied to project bprhtqtjugwgzajwrrdr

create extension if not exists pgcrypto;

create table if not exists public.signin_users (
  id text primary key,
  email text not null,
  name text not null default '',
  picture text not null default '',
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  continue_count integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists signin_users_email_idx on public.signin_users (lower(email));

create table if not exists public.signin_events (
  id text primary key,
  user_id text not null references public.signin_users (id) on delete cascade,
  email text not null,
  name text not null default '',
  at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists signin_events_user_id_idx on public.signin_events (user_id);
create index if not exists signin_events_at_idx on public.signin_events (at desc);

create table if not exists public.teacher_grants (
  email text primary key,
  granted_at timestamptz not null,
  source text not null check (source in ('admin', 'invite', 'domain')),
  granted_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  class_id text primary key,
  name text not null,
  grade integer not null check (grade between 9 and 12),
  subject_ids text[] not null default '{}',
  join_code text not null unique,
  teacher_id text not null,
  teacher_email text not null,
  teacher_name text not null default '',
  created_at timestamptz not null
);

create index if not exists classes_teacher_email_idx on public.classes (lower(teacher_email));
create index if not exists classes_join_code_idx on public.classes (join_code);

create table if not exists public.class_memberships (
  student_id text not null,
  class_id text not null references public.classes (class_id) on delete cascade,
  student_email text not null,
  student_name text not null default '',
  joined_at timestamptz not null,
  primary key (student_id, class_id)
);

create index if not exists class_memberships_class_id_idx on public.class_memberships (class_id);
create index if not exists class_memberships_email_idx on public.class_memberships (lower(student_email));

create table if not exists public.assignments (
  id text primary key,
  class_id text not null references public.classes (class_id) on delete cascade,
  type text not null check (type in ('lesson', 'exam_drill')),
  subject_id text not null,
  topic text not null,
  topic_slug text not null,
  due_date date not null,
  created_at timestamptz not null,
  created_by text not null
);

create index if not exists assignments_class_id_idx on public.assignments (class_id);

create table if not exists public.assignment_completions (
  assignment_id text not null references public.assignments (id) on delete cascade,
  student_id text not null,
  completed_at timestamptz not null,
  primary key (assignment_id, student_id)
);

create table if not exists public.student_progress (
  student_id text primary key,
  student_email text not null,
  student_name text not null default '',
  updated_at timestamptz not null,
  last_active_at text,
  topics jsonb not null default '{}'::jsonb,
  exam_focus_grade integer check (exam_focus_grade is null or exam_focus_grade between 9 and 12),
  recent_exam_accuracy numeric,
  created_at timestamptz not null default now()
);

create index if not exists student_progress_email_idx on public.student_progress (lower(student_email));

create table if not exists public.user_learning (
  user_id text primary key,
  version integer not null default 2,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_learning_updated_at_idx on public.user_learning (updated_at desc);

alter table public.signin_users enable row level security;
alter table public.signin_events enable row level security;
alter table public.teacher_grants enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_completions enable row level security;
alter table public.student_progress enable row level security;
alter table public.user_learning enable row level security;
