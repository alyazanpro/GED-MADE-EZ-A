import { ValidationError, NotFoundError, ConflictError } from "@/lib/api-error-handler";
import type { GradeLevel } from "@/data/curriculum";
import { SUBJECT_CATALOG } from "@/data/curriculum";
import {
  createClass,
  listClassesForTeacher,
  getClassById,
  joinClassWithCode,
  listMembershipsForStudent,
  createAssignment,
  listAssignmentsForClass,
  listAssignmentsForStudent,
  markAssignmentComplete,
  completeMatchingAssignments,
  syncStudentProgress,
  getClassRoster,
  computeClassInsights,
  getStudentDetailForTeacher,
  getAssignmentCompletionStats
} from "@/lib/classroom-store";
import type { CreateAssignmentInput, CreateClassInput, ProgressSyncInput } from "@/lib/validation-schemas";
import { logClassAction, logAssignmentAction, AuditAction } from "@/lib/audit-logger";
import type { AppUser } from "@/lib/auth-server";

export class ClassroomService {
  async createClass(
    input: CreateClassInput,
    user: AppUser,
    request?: Request
  ) {
    // Validation
    this.validateClassInput(input);
    
    // Business rules
    await this.checkTeacherQuota(user.email);
    await this.validateSubjectAvailability(input.subjectIds, input.grade);
    
    // Create class
    const room = await createClass({
      name: input.name,
      grade: input.grade,
      subjectIds: input.subjectIds,
      teacherId: user.id || user.email,
      teacherEmail: user.email,
      teacherName: user.name
    });
    
    // Audit logging
    await logClassAction(
      AuditAction.CLASS_CREATE,
      user,
      room.classId,
      { name: room.name, grade: room.grade, subjectIds: room.subjectIds },
      request
    );
    
    return room;
  }
  
  private validateClassInput(input: CreateClassInput) {
    if (!input.name?.trim()) {
      throw new ValidationError("Class name is required");
    }
    if (input.name.length > 80) {
      throw new ValidationError("Class name must be 80 characters or less");
    }
    if (![9, 10, 11, 12].includes(input.grade)) {
      throw new ValidationError("Grade must be 9-12");
    }
    if (!input.subjectIds || input.subjectIds.length === 0) {
      throw new ValidationError("At least one subject is required");
    }
    if (input.subjectIds.length > 12) {
      throw new ValidationError("Maximum 12 subjects allowed");
    }
  }
  
  private async checkTeacherQuota(teacherEmail: string) {
    const classes = await listClassesForTeacher(teacherEmail);
    if (classes.length >= 50) {
      throw new ValidationError("Teacher has reached maximum class limit (50)");
    }
  }
  
  private async validateSubjectAvailability(subjectIds: string[], grade: GradeLevel) {
    for (const subjectId of subjectIds) {
      const subject = SUBJECT_CATALOG.find(s => s.id === subjectId);
      if (!subject) {
        throw new ValidationError(`Invalid subject ID: ${subjectId}`);
      }
      
      // Check if subject is available for this grade
      const topicsForGrade = subject.grades?.includes(grade);
      if (!topicsForGrade && subjectId !== 'math' && subjectId !== 'chemistry') {
        // Allow math and chemistry for all grades as fallback
        throw new ValidationError(`Subject ${subject.name} is not available for grade ${grade}`);
      }
    }
  }
  
  async getClass(classId: string, user: AppUser) {
    const room = await getClassById(classId);
    if (!room) {
      throw new NotFoundError("Class");
    }
    
    // Check access permissions
    if (room.teacherEmail !== user.email.toLowerCase()) {
      const memberships = await listMembershipsForStudent(user.id || user.email);
      const isMember = memberships.some(m => m.class.classId === classId);
      if (!isMember) {
        throw new ValidationError("You don't have permission to access this class");
      }
    }
    
    return room;
  }
  
  async joinClass(joinCode: string, user: AppUser, request?: Request) {
    if (!joinCode?.trim()) {
      throw new ValidationError("Join code is required");
    }
    
    const result = await joinClassWithCode({
      joinCode: joinCode.trim(),
      studentId: user.id || user.email,
      studentEmail: user.email,
      studentName: user.name
    });
    
    if (result.alreadyJoined) {
      return result;
    }
    
    // Audit logging
    await logClassAction(
      AuditAction.CLASS_JOIN,
      user,
      result.class.classId,
      { className: result.class.name, joinCode },
      request
    );
    
    return result;
  }
  
  async createAssignment(
    classId: string,
    input: CreateAssignmentInput,
    user: AppUser,
    request?: Request
  ) {
    // Validate class ownership
    const room = await getClassById(classId);
    if (!room) {
      throw new NotFoundError("Class");
    }
    
    if (room.teacherEmail !== user.email.toLowerCase()) {
      throw new ValidationError("You can only create assignments for your own classes");
    }
    
    // Validate assignment input
    this.validateAssignmentInput(input);
    
    // Create assignment
    const assignment = await createAssignment({
      classId,
      type: input.type,
      subjectId: input.subjectId,
      topic: input.topic,
      dueDate: input.dueDate,
      createdBy: user.id || user.email
    });
    
    // Audit logging
    await logAssignmentAction(
      AuditAction.ASSIGNMENT_CREATE,
      user,
      assignment.id,
      { 
        classId, 
        type: assignment.type, 
        subjectId: assignment.subjectId, 
        topic: assignment.topic 
      },
      request
    );
    
    return assignment;
  }
  
  private validateAssignmentInput(input: CreateAssignmentInput) {
    if (!['lesson', 'exam_drill'].includes(input.type)) {
      throw new ValidationError("Assignment type must be 'lesson' or 'exam_drill'");
    }
    
    if (!input.subjectId?.trim()) {
      throw new ValidationError("Subject ID is required");
    }
    
    if (!input.topic?.trim()) {
      throw new ValidationError("Topic is required");
    }
    
    if (!input.dueDate?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new ValidationError("Due date must be in YYYY-MM-DD format");
    }
    
    const dueDate = new Date(input.dueDate);
    const now = new Date();
    const maxFuture = new Date();
    maxFuture.setFullYear(maxFuture.getFullYear() + 1);
    
    if (dueDate < now) {
      throw new ValidationError("Due date cannot be in the past");
    }
    
    if (dueDate > maxFuture) {
      throw new ValidationError("Due date cannot be more than 1 year in the future");
    }
  }
  
  async completeAssignment(
    assignmentId: string,
    user: AppUser,
    request?: Request
  ) {
    const completion = await markAssignmentComplete({
      assignmentId,
      studentId: user.id || user.email
    });
    
    if (completion) {
      await logAssignmentAction(
        AuditAction.ASSIGNMENT_COMPLETE,
        user,
        assignmentId,
        {},
        request
      );
    }
    
    return completion;
  }
  
  async syncProgress(
    user: AppUser,
    progressData: ProgressSyncInput,
    _request?: Request
  ) {
    const snapshot = await syncStudentProgress({
      studentId: user.id || user.email,
      studentEmail: user.email,
      studentName: user.name,
      topics: progressData.topics || {},
      lastActiveAt: progressData.lastActiveAt || new Date().toISOString(),
      examFocusGrade: progressData.examFocusGrade ?? null,
      recentExamAccuracy: progressData.recentExamAccuracy,
      version: progressData.version
    });
    
    return snapshot;
  }
  
  async getClassInsights(classId: string, user: AppUser) {
    const room = await getClassById(classId);
    if (!room) {
      throw new NotFoundError("Class");
    }
    
    if (room.teacherEmail !== user.email.toLowerCase()) {
      throw new ValidationError("You can only view insights for your own classes");
    }
    
    return computeClassInsights(classId);
  }
  
  async getClassRoster(classId: string, user: AppUser) {
    const room = await getClassById(classId);
    if (!room) {
      throw new NotFoundError("Class");
    }
    
    if (room.teacherEmail !== user.email.toLowerCase()) {
      throw new ValidationError("You can only view roster for your own classes");
    }
    
    return getClassRoster(classId);
  }
  
  async findByTeacher(teacherEmail: string) {
    return listClassesForTeacher(teacherEmail);
  }
  
  async getMembershipsForStudent(studentId: string) {
    const memberships = await listMembershipsForStudent(studentId);
    return Promise.all(memberships.map(async (m) => ({
      class: await getClassById(m.membership.classId),
      membership: m.membership
    })));
  }
}

// Singleton instance
export const classroomService = new ClassroomService();
