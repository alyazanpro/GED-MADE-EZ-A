import { isSuperAdminEmail } from "./admin";
import { loadClassroomStore } from "./classroom-store";
import { resolveIsTeacher } from "./teacher";
import type { AppUser } from "./auth-server";
import { AuthorizationError } from "./api-error-handler";

export enum Permission {
  // User management
  USER_VIEW = "user:view",
  USER_MANAGE = "user:manage",
  
  // Class management
  CLASS_CREATE = "class:create",
  CLASS_VIEW = "class:view",
  CLASS_EDIT = "class:edit",
  CLASS_DELETE = "class:delete",
  CLASS_JOIN = "class:join",
  
  // Assignment management
  ASSIGNMENT_CREATE = "assignment:create",
  ASSIGNMENT_VIEW = "assignment:view",
  ASSIGNMENT_EDIT = "assignment:edit",
  ASSIGNMENT_DELETE = "assignment:delete",
  ASSIGNMENT_COMPLETE = "assignment:complete",
  
  // Student management
  STUDENT_VIEW = "student:view",
  STUDENT_MANAGE = "student:manage",
  STUDENT_PROGRESS_VIEW = "student:progress:view",
  
  // Teacher management
  TEACHER_GRANT = "teacher:grant",
  TEACHER_REVOKE = "teacher:revoke",
  TEACHER_VIEW = "teacher:view",
  
  // Analytics
  ANALYTICS_VIEW = "analytics:view",
  ANALYTICS_EXPORT = "analytics:export",
  
  // Content management
  CONTENT_VIEW = "content:view",
  CONTENT_MANAGE = "content:manage",
  
  // System administration
  SYSTEM_CONFIGURE = "system:configure",
  SYSTEM_MONITOR = "system:monitor",
  AUDIT_VIEW = "audit:view"
}

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  TEACHER = "teacher",
  STUDENT = "student",
  GUEST = "guest"
}

// Role permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    Permission.USER_VIEW,
    Permission.USER_MANAGE,
    Permission.CLASS_CREATE,
    Permission.CLASS_VIEW,
    Permission.CLASS_EDIT,
    Permission.CLASS_DELETE,
    Permission.CLASS_JOIN,
    Permission.ASSIGNMENT_CREATE,
    Permission.ASSIGNMENT_VIEW,
    Permission.ASSIGNMENT_EDIT,
    Permission.ASSIGNMENT_DELETE,
    Permission.ASSIGNMENT_COMPLETE,
    Permission.STUDENT_VIEW,
    Permission.STUDENT_MANAGE,
    Permission.STUDENT_PROGRESS_VIEW,
    Permission.TEACHER_GRANT,
    Permission.TEACHER_REVOKE,
    Permission.TEACHER_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.CONTENT_VIEW,
    Permission.CONTENT_MANAGE,
    Permission.SYSTEM_CONFIGURE,
    Permission.SYSTEM_MONITOR,
    Permission.AUDIT_VIEW
  ],
  
  [UserRole.TEACHER]: [
    Permission.CLASS_CREATE,
    Permission.CLASS_VIEW,
    Permission.CLASS_EDIT,
    Permission.CLASS_DELETE,
    Permission.ASSIGNMENT_CREATE,
    Permission.ASSIGNMENT_VIEW,
    Permission.ASSIGNMENT_EDIT,
    Permission.ASSIGNMENT_DELETE,
    Permission.STUDENT_VIEW,
    Permission.STUDENT_PROGRESS_VIEW,
    Permission.CONTENT_VIEW,
    Permission.ANALYTICS_VIEW
  ],
  
  [UserRole.STUDENT]: [
    Permission.CLASS_VIEW,
    Permission.CLASS_JOIN,
    Permission.ASSIGNMENT_VIEW,
    Permission.ASSIGNMENT_COMPLETE,
    Permission.CONTENT_VIEW,
    Permission.STUDENT_PROGRESS_VIEW
  ],
  
  [UserRole.GUEST]: [
    Permission.CONTENT_VIEW
  ]
};

// Resource-based permissions
const RESOURCE_PERMISSIONS: Record<string, Permission[]> = {
  own_class: [Permission.CLASS_VIEW, Permission.CLASS_EDIT, Permission.CLASS_DELETE],
  own_assignment: [Permission.ASSIGNMENT_VIEW, Permission.ASSIGNMENT_EDIT, Permission.ASSIGNMENT_DELETE],
  own_progress: [Permission.STUDENT_PROGRESS_VIEW]
};

export async function getUserRole(user: AppUser): Promise<UserRole> {
  if (isSuperAdminEmail(user.email)) {
    return UserRole.SUPER_ADMIN;
  }
  
  const store = await loadClassroomStore();
  if (resolveIsTeacher(store, user.email)) {
    return UserRole.TEACHER;
  }
  
  return UserRole.STUDENT;
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

export async function requirePermission(
  user: AppUser,
  permission: Permission
): Promise<void> {
  const role = await getUserRole(user);
  
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(
      `User does not have permission: ${permission}`
    );
  }
}

export async function requireAnyPermission(
  user: AppUser,
  permissions: Permission[]
): Promise<void> {
  const role = await getUserRole(user);
  
  if (!hasAnyPermission(role, permissions)) {
    throw new AuthorizationError(
      `User does not have any of the required permissions: ${permissions.join(", ")}`
    );
  }
}

export async function requireAllPermissions(
  user: AppUser,
  permissions: Permission[]
): Promise<void> {
  const role = await getUserRole(user);
  
  if (!hasAllPermissions(role, permissions)) {
    throw new AuthorizationError(
      `User does not have all required permissions: ${permissions.join(", ")}`
    );
  }
}

// Resource ownership checks
export async function checkClassOwnership(
  user: AppUser,
  classId: string
): Promise<boolean> {
  const role = await getUserRole(user);
  
  // Super admins can access any class
  if (role === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  // Teachers can only access their own classes
  if (role === UserRole.TEACHER) {
    const store = await loadClassroomStore();
    const classRoom = store.classes[classId];
    return classRoom?.teacherEmail === user.email.toLowerCase();
  }
  
  // Students can only access classes they're members of
  if (role === UserRole.STUDENT) {
    const store = await loadClassroomStore();
    const membership = store.memberships.find(
      m => m.classId === classId && m.studentId === user.id
    );
    return Boolean(membership);
  }
  
  return false;
}

export async function requireClassOwnership(
  user: AppUser,
  classId: string
): Promise<void> {
  const hasAccess = await checkClassOwnership(user, classId);
  
  if (!hasAccess) {
    throw new AuthorizationError(
      "You do not have permission to access this class"
    );
  }
}

// Permission middleware for API routes
export function withPermission(permission: Permission) {
  return async (user: AppUser) => {
    await requirePermission(user, permission);
  };
}

export function withAnyPermission(permissions: Permission[]) {
  return async (user: AppUser) => {
    await requireAnyPermission(user, permissions);
  };
}

export function withAllPermissions(permissions: Permission[]) {
  return async (user: AppUser) => {
    await requireAllPermissions(user, permissions);
  };
}
