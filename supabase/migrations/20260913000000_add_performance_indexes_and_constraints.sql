-- Performance indexes and additional constraints
-- Improves query performance and enforces business rules at database level

-- Add performance indexes
create index if not exists idx_student_progress_updated_at on public.student_progress(updated_at desc);
create index if not exists idx_assignments_due_date on public.assignments(due_date);
create index if not exists idx_assignment_completions_student_id on public.assignment_completions(student_id);
create index if not exists idx_class_memberships_student_id on public.class_memberships(student_id);
create index if not exists idx_assignments_class_id_type on public.assignments(class_id, type);
create index if not exists idx_student_progress_exam_focus_grade on public.student_progress(exam_focus_grade) where exam_focus_grade is not null;

-- Add business rule constraints
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'check_subject_ids_not_empty') then
        alter table public.classes add constraint check_subject_ids_not_empty check (array_length(subject_ids, 1) > 0);
    end if;
    if not exists (select 1 from pg_constraint where conname = 'check_name_not_empty') then
        alter table public.classes add constraint check_name_not_empty check (trim(name) != '');
    end if;
    if not exists (select 1 from pg_constraint where conname = 'check_exam_focus_grade_valid') then
        alter table public.student_progress add constraint check_exam_focus_grade_valid
            check (exam_focus_grade is null or exam_focus_grade between 9 and 12);
    end if;
end $$;

-- Add updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add triggers for automatic updated_at
drop trigger if exists trigger_student_progress_updated_at on public.student_progress;
create trigger trigger_student_progress_updated_at
    before update on public.student_progress
    for each row
    execute function public.update_updated_at_column();

drop trigger if exists trigger_user_learning_updated_at on public.user_learning;
create trigger trigger_user_learning_updated_at
    before update on public.user_learning
    for each row
    execute function public.update_updated_at_column();

-- Add soft delete support
alter table public.classes add column if not exists deleted_at timestamptz;
alter table public.assignments add column if not exists deleted_at timestamptz;
alter table public.class_memberships add column if not exists deleted_at timestamptz;

-- Create indexes for soft delete queries
create index if not exists idx_classes_deleted_at on public.classes(deleted_at) where deleted_at is null;
create index if not exists idx_assignments_deleted_at on public.assignments(deleted_at) where deleted_at is null;
create index if not exists idx_class_memberships_deleted_at on public.class_memberships(deleted_at) where deleted_at is null;
