import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { joinClassWithCode } from "@/lib/classroom-store";
import { JoinClassSchema } from "@/lib/validation-schemas";
import { getClientIP, strictRateLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  await strictRateLimiter.checkByUser(auth.user.id || auth.user.email);
  await strictRateLimiter.checkByIP(getClientIP(request));

  try {
    const body = JoinClassSchema.parse(await request.json());
    const result = await joinClassWithCode({
      joinCode: body.joinCode,
      studentId: auth.user.id || auth.user.email,
      studentEmail: auth.user.email,
      studentName: auth.user.name,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not join class." },
      { status: 400 }
    );
  }
}
