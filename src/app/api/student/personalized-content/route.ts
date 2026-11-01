import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { withAuthErrorHandler } from "@/lib/auth-request";
import { studentService } from "@/services/student.service";
import { generalRateLimiter } from "@/lib/rate-limiter";
import { getClientIP } from "@/lib/rate-limiter";
import { measurePerformance } from "@/lib/performance";

export async function GET(request: NextRequest) {
  return withAuthErrorHandler(async () => {
    const auth = await requireUser(request);
    
    // Rate limiting
    await generalRateLimiter.checkByUser(auth.user.id);
    await generalRateLimiter.checkByIP(getClientIP(request));
    
    return measurePerformance("api.student.personalized-content.get", async () => {
      const content = await studentService.getPersonalizedContent(auth.user);
      
      return NextResponse.json(content);
    });
  });
}
