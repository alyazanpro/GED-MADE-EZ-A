import { createServiceClient } from "./supabase/server";
import type { AppUser } from "./auth-server";

export enum AuditAction {
  // User actions
  USER_SIGN_IN = "user.sign_in",
  USER_SIGN_OUT = "user.sign_out",
  USER_REGISTER = "user.register",
  USER_PROFILE_UPDATE = "user.profile_update",
  
  // Class actions
  CLASS_CREATE = "class.create",
  CLASS_UPDATE = "class.update",
  CLASS_DELETE = "class.delete",
  CLASS_JOIN = "class.join",
  CLASS_LEAVE = "class.leave",
  
  // Assignment actions
  ASSIGNMENT_CREATE = "assignment.create",
  ASSIGNMENT_UPDATE = "assignment.update",
  ASSIGNMENT_DELETE = "assignment.delete",
  ASSIGNMENT_COMPLETE = "assignment.complete",
  
  // Teacher actions
  TEACHER_GRANT = "teacher.grant",
  TEACHER_REVOKE = "teacher.revoke",
  TEACHER_CLAIM = "teacher.claim",
  
  // Progress actions
  PROGRESS_SYNC = "progress.sync",
  PROGRESS_UPDATE = "progress.update",
  
  // System actions
  SYSTEM_CONFIG_CHANGE = "system.config_change",
  SYSTEM_ERROR = "system.error",
  ADMIN_ACCESS = "admin.access"
}

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient();
    
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { error } = await supabase.from("audit_logs").insert({
      id: logId,
      action: entry.action,
      user_id: entry.userId || null,
      user_email: entry.userEmail || null,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      details: entry.details || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null
    });
    
    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (error) {
    console.error("Audit logging error:", error);
    // Don't throw - audit logging should never break the main flow
  }
}

// Convenience functions for common audit scenarios
export async function logUserAction(
  action: AuditAction,
  user: AppUser,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    action,
    userId: user.id,
    userEmail: user.email,
    entityType,
    entityId,
    details,
    ipAddress: request ? getClientIP(request) : undefined,
    userAgent: request?.headers.get("user-agent") || undefined
  });
}

export async function logSystemAction(
  action: AuditAction,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    action,
    entityType,
    entityId,
    details
  });
}

export async function logClassAction(
  action: AuditAction,
  user: AppUser,
  classId: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logUserAction(action, user, "class", classId, details, request);
}

export async function logAssignmentAction(
  action: AuditAction,
  user: AppUser,
  assignmentId: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logUserAction(action, user, "assignment", assignmentId, details, request);
}

export async function logTeacherAction(
  action: AuditAction,
  user: AppUser,
  targetEmail: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await logUserAction(action, user, "teacher_grant", targetEmail, details, request);
}

// Utility to get client IP from request
function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

// Audit log query functions
export async function getAuditLogsByUser(
  userId: string,
  limit: number = 50
): Promise<unknown[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string,
  limit: number = 50
): Promise<unknown[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}

export async function getAuditLogsByAction(
  action: AuditAction,
  limit: number = 50
): Promise<unknown[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("action", action)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}
