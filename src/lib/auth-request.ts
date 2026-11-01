import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/admin";
import { decodeAccessToken, type AppUser } from "@/lib/auth-server";
import { loadClassroomStore } from "@/lib/classroom-store";
import { canAccessTeacherConsole, resolveIsTeacher } from "@/lib/teacher";
import { AuthenticationError, AuthorizationError, handleApiError } from "@/lib/api-error-handler";
import { requirePermission } from "@/lib/rbac";
import { Permission } from "@/lib/rbac";

export async function requireUser(
  request: NextRequest
): Promise<{ user: AppUser }> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    throw new AuthenticationError();
  }
  try {
    const user = await decodeAccessToken(token);
    return { user };
  } catch {
    throw new AuthenticationError("Invalid or expired session. Please sign in again.");
  }
}

export async function requireTeacher(
  request: NextRequest
): Promise<{ user: AppUser; isTeacher: boolean; isSuperAdmin: boolean }> {
  const auth = await requireUser(request);

  const store = await loadClassroomStore();
  const isSuperAdmin = isSuperAdminEmail(auth.user.email);
  const isTeacher = resolveIsTeacher(store, auth.user.email);

  if (!canAccessTeacherConsole(store, auth.user.email)) {
    throw new AuthorizationError("Teacher access required.");
  }

  return { user: auth.user, isTeacher, isSuperAdmin };
}

export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ user: AppUser }> {
  const auth = await requireUser(request);
  if (!isSuperAdminEmail(auth.user.email)) {
    throw new AuthorizationError("Super admin access required.");
  }
  return { user: auth.user };
}

// RBAC-based authorization helpers
export async function requirePermissionWrapper(
  request: NextRequest,
  permission: Permission
): Promise<{ user: AppUser }> {
  const auth = await requireUser(request);
  await requirePermission(auth.user, permission);
  return auth;
}

export async function withAuthErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  return handler().catch(handleApiError);
}
