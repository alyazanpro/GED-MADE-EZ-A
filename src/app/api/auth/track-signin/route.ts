import { NextRequest, NextResponse } from "next/server";
import { decodeAccessToken } from "@/lib/auth-server";
import { recordSignIn } from "@/lib/signin-store";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const user = await decodeAccessToken(token);
    const recorded = await recordSignIn({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
    return NextResponse.json({ ok: true, user: recorded });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired session." },
      { status: 401 }
    );
  }
}
