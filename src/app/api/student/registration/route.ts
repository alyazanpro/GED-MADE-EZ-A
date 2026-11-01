import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-request";
import { withAuthErrorHandler } from "@/lib/auth-request";
import { studentService } from "@/services/student.service";
import { StudentRegistrationSchema, UpdateStudentProfileSchema } from "@/lib/validation-schemas";
import { authRateLimiter } from "@/lib/rate-limiter";
import { getClientIP } from "@/lib/rate-limiter";
import { measurePerformance } from "@/lib/performance";

export async function GET(request: NextRequest) {
  return withAuthErrorHandler(async () => {
    const auth = await requireUser(request);
    
    return measurePerformance("api.student.registration.get", async () => {
      const profile = await studentService.getProfile(auth.user);
      
      if (!profile) {
        return NextResponse.json({ 
          registered: false,
          profile: null 
        });
      }
      
      return NextResponse.json({ 
        registered: profile.registrationCompleted,
        profile 
      });
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuthErrorHandler(async () => {
    const auth = await requireUser(request);
    
    // Rate limiting
    await authRateLimiter.checkByEmail(auth.user.email);
    await authRateLimiter.checkByIP(getClientIP(request));
    
    return measurePerformance("api.student.registration.post", async () => {
      const body = await request.json();
      
      // Validate input
      const validated = StudentRegistrationSchema.parse(body);
      
      // Create profile
      const profile = await studentService.createProfile(
        auth.user,
        validated,
        request
      );
      
      return NextResponse.json({ 
        success: true,
        profile 
      }, { status: 201 });
    });
  });
}

export async function PATCH(request: NextRequest) {
  return withAuthErrorHandler(async () => {
    const auth = await requireUser(request);
    
    // Rate limiting
    await authRateLimiter.checkByEmail(auth.user.email);
    
    return measurePerformance("api.student.registration.patch", async () => {
      const body = await request.json();
      
      // Validate input
      const validated = UpdateStudentProfileSchema.parse(body);
      
      // Update profile
      const profile = await studentService.updateProfile(
        auth.user,
        validated,
        request
      );
      
      return NextResponse.json({ 
        success: true,
        profile 
      });
    });
  });
}

export async function DELETE(request: NextRequest) {
  return withAuthErrorHandler(async () => {
    const auth = await requireUser(request);
    
    // Rate limiting
    await authRateLimiter.checkByEmail(auth.user.email);
    
    return measurePerformance("api.student.registration.delete", async () => {
      await studentService.deleteProfile(auth.user);
      
      return NextResponse.json({ 
        success: true 
      });
    });
  });
}
