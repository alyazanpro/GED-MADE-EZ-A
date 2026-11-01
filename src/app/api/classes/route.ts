import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireTeacher } from "@/lib/auth-request";
import { withAuthErrorHandler } from "@/lib/auth-request";
import { classroomService } from "@/services/classroom.service";
import { CreateClassSchema } from "@/lib/validation-schemas";
import { writeOperationRateLimiter } from "@/lib/rate-limiter";
import { getClientIP } from "@/lib/rate-limiter";
import { measurePerformance } from "@/lib/performance";

export async function GET(request: NextRequest) {
  return withAuthErrorHandler(async () => {
    const auth = await requireUser(request);
    
    return measurePerformance("api.classes.get", async () => {
      const role = request.nextUrl.searchParams.get("role") || "student";

      if (role === "teacher") {
        const teacherAuth = await requireTeacher(request);
        const classes = await classroomService.findByTeacher(teacherAuth.user.email);
        return NextResponse.json({ classes });
      }

      const memberships = await classroomService.getMembershipsForStudent(auth.user.id || auth.user.email);
      return NextResponse.json({
        classes: memberships
          .filter(m => m.class !== null)
          .map((m) => ({
            ...m.class,
            joinedAt: m.membership.joinedAt,
          })),
      });
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuthErrorHandler(async () => {
    const auth = await requireTeacher(request);
    
    // Rate limiting
    await writeOperationRateLimiter.checkByUser(auth.user.id);
    await writeOperationRateLimiter.checkByIP(getClientIP(request));
    
    return measurePerformance("api.classes.post", async () => {
      const body = await request.json();
      
      // Validate input
      const validated = CreateClassSchema.parse(body);
      
      // Create class using service
      const room = await classroomService.createClass(
        validated,
        auth.user,
        request
      );
      
      return NextResponse.json({ class: room }, { status: 201 });
    });
  });
}
