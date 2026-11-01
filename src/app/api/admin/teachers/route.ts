import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { requireSuperAdmin } from "@/lib/auth-request";
import { normalizeEmail } from "@/lib/auth-server";
import { grantTeacherRole, loadClassroomStore } from "@/lib/classroom-store";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const store = await loadClassroomStore();
  const teachers = Object.values(store.teachers).sort((a, b) =>
    b.grantedAt.localeCompare(a.grantedAt)
  );
  return NextResponse.json({ teachers });
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (isSuperAdminEmail(email)) {
    return NextResponse.json(
      { error: "Super admin is separate from teacher role; use a teacher email." },
      { status: 400 }
    );
  }

  const grant = await grantTeacherRole({
    email,
    source: "admin",
    grantedBy: auth.user.email,
  });
  return NextResponse.json({ ok: true, grant });
}
