import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { decodeAccessToken } from "@/lib/auth-server";
import { getSignInAnalytics } from "@/lib/signin-store";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const user = await decodeAccessToken(token);
    if (!isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: "Super admin access required." }, { status: 403 });
    }

    const analytics = await getSignInAnalytics();
    return NextResponse.json({
      ...analytics,
      superAdminEmail: user.email,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }
}
