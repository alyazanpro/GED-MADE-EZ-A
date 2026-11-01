# GED MADE EZ

Oman MoE study OS for Grades 9–12 (Basic Education → General Education Diploma).  
Textbook-grounded tutor, Exam OS readiness, bilingual EN/ع lessons, and teacher class assignments — **not** a generic AI study / Khan clone.

Built with **Next.js 15**, **React 19**, **Tailwind CSS**, and **Supabase Auth + Postgres**.

## What makes this different

| Differentiator | What it actually does |
| --- | --- |
| **Answers from YOUR MoE textbooks** | Shared corpus under `books/` + personal PDF uploads. Tutor cites title + page range. |
| **Oman Grades 9–12 / GED pathway** | Curriculum and exam bank mapped to MoE stages — not a worldwide video library. |
| **Exam OS + readiness** | Topic drills, mixed papers, timed mocks. Score uses mastery, 7-day exam accuracy, coverage, recency. |
| **Bilingual EN / ع** | Learning language: English, العربية, or Mixed (STEM terms EN + Arabic شرح). |
| **Teacher class assignments** | Join codes, lesson/exam drills, academic sync — chat stays private. |

Khan Academy has great general content. We help you pass **Oman MoE exams with your books**.

## Features (shipped)

- **Landing** — MoE positioning, proof routes (Library / Exams / Subjects / Classes), vs-Khan strip, product proofs (no fake score testimonials)
- **Email sign-in** — Supabase Auth (create account / sign in)
- **Dashboard** — Live streak/mastery/readiness + first-run checklist
- **Subjects** — Lessons with Start lesson → videos, notes, quiz
- **Library** — MoE corpus + personal PDF indexing (RAG)
- **AI Tutor** — Grounded answers with MoE / upload citations (optional OpenAI/Gemini)
- **Exam OS** — `/exams` practice + readiness breakdown
- **Analytics / Planner** — Real activity-driven charts and tasks
- **Classes / Teacher** — Join codes and assignments (`docs/teacher-classes.md`)
- **Supabase database** — classrooms, learning progress, and sign-in analytics in Postgres

## Shared MoE textbook corpus (RAG)

Pre-index PDFs under `books/` so tutors work out of the box:

```bash
npm run index:moe-corpus
# faster smoke tests:
npm run index:moe-corpus:chemistry
npm run index:moe-corpus:math
```

Outputs:

- `public/corpus/manifest.json` + `public/corpus/subjects/*.json`
- `books/_raw/corpus_index_report.md`

Resume-safe: re-run skips unchanged files. Use `--force` to re-extract.

Typecheck: `npm run typecheck`

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` → `.env.local` and set Supabase keys from your project dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPER_ADMIN_EMAIL=you@example.com
```

In Supabase Auth settings:

1. **Site URL** → `http://localhost:3000`
2. **Redirect URLs** → `http://localhost:3000/auth/callback`
3. Optionally turn **Confirm email** off for local development (Authentication → Sign In / Providers)

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account from `/auth/signin`.

**Teacher role** (any one path — see `docs/teacher-classes.md`):

```bash
TEACHER_EMAIL_DOMAINS=moe.gov.om,school.edu.om
TEACHER_EMAILS=teacher1@example.com
TEACHER_INVITE_CODE=oman-teachers-2026
# or grant from /admin → “Grant teacher role”
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account or sign in at `/auth/signin`.

## Bilingual learning (Oman)

Students set **Learning language** to English, العربية, or Mixed (default). STEM lessons use English terms with Arabic explanation in Mixed mode. See [docs/bilingual-lessons.md](docs/bilingual-lessons.md).

## Teacher / class layer

Teachers create classes with join codes; students join from the dashboard or `/classes`. Academic progress syncs to Supabase (no chat transcripts). See [docs/teacher-classes.md](docs/teacher-classes.md).

## Stack

- Next.js 15 (App Router) · React 19 · Tailwind CSS 4
- Supabase Auth (email/password) + Postgres
- Framer Motion · Recharts · Lucide React
- Optional OpenAI / Gemini for tutor generation + embeddings

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Landing
│   ├── api/auth/             # Session / me / sign-in tracking
│   ├── api/tutor/            # Grounded answer + embed (optional keys)
│   ├── auth/                 # Sign-in + callback
│   └── (app)/                # Dashboard, library, tutor, exams, …
├── components/landing/       # Landing sections
├── data/                     # Curriculum, exam bank, lessons, mock marketing copy
├── lib/supabase/             # Browser + server Supabase clients
└── lib/                      # Auth, RAG, user learning, classrooms
```

## License

MIT
