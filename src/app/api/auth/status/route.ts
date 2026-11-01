import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/auth-server";

export async function GET() {
  return NextResponse.json({
    authConfigured: supabaseConfigured(),
    provider: "supabase",
    loginUrl: "/auth/signin",
  });
}
