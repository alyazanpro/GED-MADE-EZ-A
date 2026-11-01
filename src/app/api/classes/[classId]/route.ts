import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/auth-server";
import { requireTeacher, requireUser } from "@/lib/auth-request";
import {
  computeClassInsights,
  getAssignmentCompletionStats,
  getClassById,
  getClassRoster,
  getStudentDetailForTeacher,
  listAssignmentsForClass,
} from "@/lib/classroom-store";
import { isSuperAdminEmail } from "@/lib/admin";

type Ctx = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const { classId } = await context.params;
  const room = await getClassById(classId);
  if (!room) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const isOwner =
    normalizeEmail(room.teacherEmail) === normalizeEmail(auth.user.email) ||
    isSuperAdminEmail(auth.user.email);

  const studentId = request.nextUrl.searchParams.get("studentId");
  if (studentId) {
    if (!isOwner) {
      return NextResponse.json({ error: "Teacher access required." }, { status: 403 });
    }
    const detail = await getStudentDetailForTeacher({
      classId,
      studentId,
      teacherEmail: room.teacherEmail,
      bypassOwnerCheck: isSuperAdminEmail(auth.user.email),
    });
    if (!detail) {
      return NextResponse.json({ error: "Student not in this class." }, { status: 404 });
    }
    return NextResponse.json({ class: room, ...detail });
  }

  if (!isOwner) {
    // Students only get basic class info for classes they joined
    return NextResponse.json({
      class: {
        classId: room.classId,
        name: room.name,
        grade: room.grade,
        subjectIds: room.subjectIds,
      },
    });
  }

  const teacherAuth = await requireTeacher(request);
  if (teacherAuth instanceof NextResponse) return teacherAuth;

  const [roster, insights, assignments, completionStats] = await Promise.all([
    getClassRoster(classId),
    computeClassInsights(classId),
    listAssignmentsForClass(classId),
    getAssignmentCompletionStats(classId),
  ]);

  return NextResponse.json({
    class: room,
    roster,
    insights,
    assignments,
    completionStats,
  });
}
