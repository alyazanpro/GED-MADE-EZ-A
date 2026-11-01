import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/auth-server";
import { requireTeacher } from "@/lib/auth-request";
import { isSuperAdminEmail } from "@/lib/admin";
import {
  createAssignment,
  getClassById,
  listAssignmentsForClass,
} from "@/lib/classroom-store";
import { CreateAssignmentSchema } from "@/lib/validation-schemas";
import { getClientIP, writeOperationRateLimiter } from "@/lib/rate-limiter";

type Ctx = { params: Promise<{ classId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const auth = await requireTeacher(request);
  if (auth instanceof NextResponse) return auth;
  await writeOperationRateLimiter.checkByUser(auth.user.id || auth.user.email);
  await writeOperationRateLimiter.checkByIP(getClientIP(request));

  const { classId } = await context.params;
  const room = await getClassById(classId);
  if (!room) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }
  if (
    normalizeEmail(room.teacherEmail) !== normalizeEmail(auth.user.email) &&
    !isSuperAdminEmail(auth.user.email)
  ) {
    return NextResponse.json({ error: "Not your class." }, { status: 403 });
  }

  const assignments = await listAssignmentsForClass(classId);
  return NextResponse.json({ assignments });
}

export async function POST(request: NextRequest, context: Ctx) {
  const auth = await requireTeacher(request);
  if (auth instanceof NextResponse) return auth;

  const { classId } = await context.params;
  const room = await getClassById(classId);
  if (!room) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }
  if (
    normalizeEmail(room.teacherEmail) !== normalizeEmail(auth.user.email) &&
    !isSuperAdminEmail(auth.user.email)
  ) {
    return NextResponse.json({ error: "Not your class." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = CreateAssignmentSchema.parse({ ...body, classId });
    const assignment = await createAssignment({
      classId,
      type: validated.type,
      subjectId: validated.subjectId,
      topic: validated.topic,
      dueDate: validated.dueDate,
      createdBy: auth.user.id || auth.user.email,
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create assignment." },
      { status: 400 }
    );
  }
}
