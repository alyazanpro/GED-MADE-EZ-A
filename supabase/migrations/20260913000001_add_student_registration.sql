-- Student registration and profile system
-- Allows students to provide detailed information for personalized content

-- Create student profiles table
create table if not exists public.student_profiles (
  student_id text primary key references public.signin_users (id) on delete cascade,
  email text not null,
  name text not null default '',
  
  -- Academic information
  grade_level integer not null check (grade_level between 9 and 12),
  school_name text,
  city text,
  
  -- Learning preferences
  learning_language text not null default 'mixed' check (learning_language in ('en', 'ar', 'mixed')),
  preferred_subjects text[] default '{}',
  learning_goals text[],
  
  -- Personalization
  interests text[],
  study_time_preference text, -- morning, afternoon, evening, flexible
  daily_study_goal_minutes integer default 30 check (daily_study_goal_minutes between 5 and 240),
  
  -- Registration metadata
  registration_completed boolean not null default false,
  onboarding_step integer not null default 0 check (onboarding_step between 0 and 5),
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Create indexes for student profiles
create index if not exists idx_student_profiles_email on public.student_profiles(lower(email));
create index if not exists idx_student_profiles_grade on public.student_profiles(grade_level);
create index if not exists idx_student_profiles_completed on public.student_profiles(registration_completed) where registration_completed = false;
create index if not exists idx_student_profiles_city on public.student_profiles(city) where city is not null;

-- Add trigger for updated_at
create trigger trigger_student_profiles_updated_at
    before update on public.student_profiles
    for each row
    execute function public.update_updated_at_column();

-- Enable RLS
alter table public.student_profiles enable row level security;

-- Create audit logs table
create table if not exists public.audit_logs (
  id text primary key,
  action text not null,
  user_id text,
  user_email text,
  entity_type text not null,
  entity_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Create indexes for audit logs
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id) where user_id is not null;
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Create API rate limiting table
create table if not exists public.rate_limits (
  key text primary key,
  request_count integer not null default 0,
  window_start timestamptz not null default now(),
  last_request_at timestamptz not null default now()
);

-- Create index for rate limits
create index if not exists idx_rate_limits_window on public.rate_limits(window_start);

-- Enable RLS
alter table public.rate_limits enable row level security;
