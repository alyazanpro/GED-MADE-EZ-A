import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { loadClassroomStore } from "@/lib/classroom-store";
import {
  emailMatchesTeacherDomain,
  isTeacherEmailAllowlisted,
  resolveIsTeacher,
  teacherInviteCode,
} from "@/lib/teacher";
import { isSuperAdminEmail } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const store = await loadClassroomStore();
  const isTeacher = resolveIsTeacher(store, auth.user.email);
  const isSuperAdmin = isSuperAdminEmail(auth.user.email);
  const domainEligible = emailMatchesTeacherDomain(auth.user.email);
  const emailEligible = isTeacherEmailAllowlisted(auth.user.email);
  const inviteConfigured = Boolean(teacherInviteCode());

  return NextResponse.json({
    isTeacher,
    isSuperAdmin,
    canAccessConsole: isTeacher || isSuperAdmin,
    claimOptions: {
      domainEligible,
      emailEligible,
      inviteConfigured,
    },
  });
}
