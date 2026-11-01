import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { decodeAccessToken } from "@/lib/auth-server";
import { loadClassroomStore } from "@/lib/classroom-store";
import { resolveIsTeacher } from "@/lib/teacher";
import { adoptLegacyLearningByEmail } from "@/lib/user-learning-store";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const tokenFromQuery = request.nextUrl.searchParams.get("token");
  const token = tokenFromHeader || tokenFromQuery;

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const user = await decodeAccessToken(token);
    const store = await loadClassroomStore();

    // One-time: attach prior JSON-era learning rows keyed by email/legacy id
    void adoptLegacyLearningByEmail(user.id, user.email).catch(() => undefined);

    return NextResponse.json({
      user: {
        ...user,
        isSuperAdmin: isSuperAdminEmail(user.email),
        isTeacher: resolveIsTeacher(store, user.email),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }
}
