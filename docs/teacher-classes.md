# Teacher & class layer (MVP)

Lightweight classroom sync so Omani schools/tutors can run GED MADE EZ with a join code — without a full LMS.

## Architecture

- **Auth**: existing Google JWT (CV `:8000` or local Next routes).
- **Store**: `data/classrooms.json` (same pattern as `data/google-signins.json`).
- **Student progress**: still in `localStorage` for UX; academic snapshots (topic mastery + last active) sync to the JSON store via `POST /api/progress/sync`.
- **Privacy**: teachers see mastery / activity only — **no tutor chat transcripts**.

## Granting the teacher role

Super-admin stays separate (`SUPER_ADMIN_EMAIL`). Teacher access via **any one** of:

1. **Admin grant** — signed in as super admin → `/admin` → “Grant teacher role” (email).
2. **Invite code** — set `TEACHER_INVITE_CODE` in `.env.local`, then open `/teacher` and claim.
3. **Email domain** — `TEACHER_EMAIL_DOMAINS=moe.gov.om,edu.om` then claim on `/teacher`.
4. **Email allowlist** — `TEACHER_EMAILS=a@school.om,b@school.om`.

After grant, sidebar shows **Teacher** → `/teacher`.

## Acceptance flow

1. Teacher creates a class on `/teacher` → copy join code.
2. Student enters code on dashboard **Your class**.
3. Teacher roster shows the student.
4. Teacher assigns a Math lesson topic → student sees it on dashboard/planner with link to `/subjects/[subjectId]/[topicSlug]`.
5. Student studies (or finishes matching exam drill) → progress syncs; class **weak topics** / avg mastery update from member snapshots.

## Env knobs

See `.env.example` for `TEACHER_*` variables.
