import { isSuperAdminEmail } from "@/lib/admin";
import { normalizeEmail } from "@/lib/auth-server";
import type { ClassroomStore } from "@/lib/classroom-types";

/**
 * Teacher role (separate from super-admin).
 *
 * Grant paths (any one is enough):
 * 1. Email domain allowlist — TEACHER_EMAIL_DOMAINS=moe.gov.om,school.edu.om
 * 2. Invite code — TEACHER_INVITE_CODE=oman-teachers-2026 (claim via API)
 * 3. Admin grant — stored in data/classrooms.json teachers map
 * 4. Explicit email allowlist — TEACHER_EMAILS=a@x.com,b@y.com
 *
 * Super-admins are NOT teachers by default; they can still grant teachers.
 */
export function teacherEmailDomains(): string[] {
  const raw = process.env.TEACHER_EMAIL_DOMAINS?.trim() || "";
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function teacherEmailAllowlist(): string[] {
  const raw = process.env.TEACHER_EMAILS?.trim() || "";
  return raw
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
}

export function teacherInviteCode(): string {
  return (process.env.TEACHER_INVITE_CODE || "").trim();
}

export function emailMatchesTeacherDomain(email: string): boolean {
  const normalized = normalizeEmail(email);
  const domain = normalized.split("@")[1] || "";
  if (!domain) return false;
  return teacherEmailDomains().some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );
}

export function isTeacherEmailAllowlisted(email: string): boolean {
  const normalized = normalizeEmail(email);
  return teacherEmailAllowlist().includes(normalized);
}

export function isTeacherInStore(
  store: ClassroomStore,
  email: string | null | undefined
): boolean {
  const key = normalizeEmail(email);
  return Boolean(key && store.teachers[key]);
}

export function resolveIsTeacher(
  store: ClassroomStore,
  email: string | null | undefined
): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  if (isTeacherInStore(store, normalized)) return true;
  if (isTeacherEmailAllowlisted(normalized)) return true;
  if (emailMatchesTeacherDomain(normalized)) return true;
  return false;
}

export function canAccessTeacherConsole(
  store: ClassroomStore,
  email: string | null | undefined
): boolean {
  // Super-admin may open teacher tools for support, but role stays separate.
  if (isSuperAdminEmail(email)) return true;
  return resolveIsTeacher(store, email);
}
