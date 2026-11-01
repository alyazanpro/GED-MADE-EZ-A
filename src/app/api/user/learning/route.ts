import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { validateUserLearningPayload } from "@/lib/user-learning-merge";
import {
  loadUserLearning,
  saveUserLearning,
} from "@/lib/user-learning-store";

function learningUserId(user: { id: string; email: string }): string {
  return user.id || user.email;
}

/** GET — authenticated server copy of UserLearningData (null if never synced). */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const userId = learningUserId(auth.user);
  const data = await loadUserLearning(userId);

  return NextResponse.json({
    ok: true,
    data,
    exists: data != null,
  });
}

/** PUT — upsert full UserLearningData document for the signed-in user. */
export async function PUT(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const validated = validateUserLearningPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const userId = learningUserId(auth.user);
  const saved = await saveUserLearning(userId, validated.data);

  return NextResponse.json({
    ok: true,
    data: saved,
  });
}
