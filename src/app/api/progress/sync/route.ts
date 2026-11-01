import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import {
  completeMatchingAssignments,
  syncStudentProgress,
} from "@/lib/classroom-store";
import { ProgressSyncSchema } from "@/lib/validation-schemas";
import { getClientIP, writeOperationRateLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  await writeOperationRateLimiter.checkByUser(auth.user.id || auth.user.email);
  await writeOperationRateLimiter.checkByIP(getClientIP(request));

  const body = ProgressSyncSchema.parse(await request.json().catch(() => ({})));

  const studentId = auth.user.id || auth.user.email;
  const snapshot = await syncStudentProgress({
    studentId,
    studentEmail: auth.user.email,
    studentName: auth.user.name,
    topics: body.topics || {},
    lastActiveAt: body.lastActiveAt ?? new Date().toISOString(),
    examFocusGrade: body.examFocusGrade ?? null,
    recentExamAccuracy: body.recentExamAccuracy,
  });

  let completedAssignments = 0;
  if (body.completedLesson) {
    completedAssignments += await completeMatchingAssignments({
      studentId,
      subjectId: body.completedLesson.subjectId,
      topic: body.completedLesson.topic,
      type: "lesson",
    });
  }
  if (body.completedExamDrill) {
    completedAssignments += await completeMatchingAssignments({
      studentId,
      subjectId: body.completedExamDrill.subjectId,
      topic: body.completedExamDrill.topic,
      // Also complete lesson assignments for same topic if they finished a drill
      type: undefined,
    });
  }

  return NextResponse.json({
    ok: true,
    snapshot: {
      updatedAt: snapshot.updatedAt,
      topicCount: Object.keys(snapshot.topics).length,
    },
    completedAssignments,
  });
}
