import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { listAssignmentsForStudent } from "@/lib/classroom-store";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const studentId = auth.user.id || auth.user.email;
  const assignments = await listAssignmentsForStudent(studentId);
  return NextResponse.json({ assignments });
}
