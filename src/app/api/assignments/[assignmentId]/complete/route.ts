import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { markAssignmentComplete } from "@/lib/classroom-store";

type Ctx = { params: Promise<{ assignmentId: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const { assignmentId } = await context.params;
  const studentId = auth.user.id || auth.user.email;
  const completion = await markAssignmentComplete({ assignmentId, studentId });
  if (!completion) {
    return NextResponse.json(
      { error: "Assignment not found or you are not in that class." },
      { status: 404 }
    );
  }
  return NextResponse.json({ completion });
}
