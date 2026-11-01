import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { grantTeacherRole, loadClassroomStore } from "@/lib/classroom-store";
import {
  emailMatchesTeacherDomain,
  isTeacherEmailAllowlisted,
  resolveIsTeacher,
  teacherInviteCode,
} from "@/lib/teacher";
import { normalizeEmail } from "@/lib/auth-server";
import { getClientIP, authRateLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  await authRateLimiter.checkByEmail(auth.user.email);
  await authRateLimiter.checkByIP(getClientIP(request));

  const body = (await request.json().catch(() => ({}))) as { inviteCode?: string };
  const store = await loadClassroomStore();

  if (resolveIsTeacher(store, auth.user.email)) {
    return NextResponse.json({ ok: true, alreadyTeacher: true });
  }

  if (emailMatchesTeacherDomain(auth.user.email) || isTeacherEmailAllowlisted(auth.user.email)) {
    const grant = await grantTeacherRole({
      email: auth.user.email,
      source: emailMatchesTeacherDomain(auth.user.email) ? "domain" : "admin",
      grantedBy: "auto",
    });
    return NextResponse.json({ ok: true, grant });
  }

  const expected = teacherInviteCode();
  const provided = (body.inviteCode || "").trim();
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "No teacher invite code configured. Ask a super admin to grant access, or set TEACHER_INVITE_CODE / TEACHER_EMAIL_DOMAINS.",
      },
      { status: 400 }
    );
  }
  if (provided !== expected) {
    return NextResponse.json({ error: "Invalid teacher invite code." }, { status: 403 });
  }

  const grant = await grantTeacherRole({
    email: normalizeEmail(auth.user.email),
    source: "invite",
    grantedBy: "invite-code",
  });
  return NextResponse.json({ ok: true, grant });
}
