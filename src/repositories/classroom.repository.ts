import {
  loadClassroomStore,
  updateStore
} from "@/lib/classroom-store";
import type {
  ClassRoom,
  ClassMembership,
  ClassAssignment,
  AssignmentCompletion,
  StudentProgressSnapshot,
  TeacherGrant
} from "@/lib/classroom-types";
import { NotFoundError } from "@/lib/api-error-handler";

export class ClassroomRepository {
  async findById(classId: string): Promise<ClassRoom | null> {
    const store = await loadClassroomStore();
    return store.classes[classId] || null;
  }

  async findByTeacher(teacherEmail: string): Promise<ClassRoom[]> {
    const store = await loadClassroomStore();
    return Object.values(store.classes)
      .filter(c => c.teacherEmail === teacherEmail.toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByJoinCode(joinCode: string): Promise<ClassRoom | null> {
    const store = await loadClassroomStore();
    return Object.values(store.classes).find(
      c => c.joinCode === joinCode.toUpperCase()
    ) || null;
  }

  async save(classRoom: ClassRoom): Promise<void> {
    await updateStore(store => {
      store.classes[classRoom.classId] = classRoom;
    });
  }

  async delete(classId: string): Promise<void> {
    await updateStore(store => {
      delete store.classes[classId];
    });
  }

  async findAll(): Promise<ClassRoom[]> {
    const store = await loadClassroomStore();
    return Object.values(store.classes);
  }
}

export class MembershipRepository {
  async findByStudent(studentId: string): Promise<ClassMembership[]> {
    const store = await loadClassroomStore();
    return store.memberships.filter(m => m.studentId === studentId);
  }

  async findByClass(classId: string): Promise<ClassMembership[]> {
    const store = await loadClassroomStore();
    return store.memberships.filter(m => m.classId === classId);
  }

  async find(
    studentId: string,
    classId: string
  ): Promise<ClassMembership | null> {
    const store = await loadClassroomStore();
    return store.memberships.find(
      m => m.studentId === studentId && m.classId === classId
    ) || null;
  }

  async save(membership: ClassMembership): Promise<void> {
    await updateStore(store => {
      const existingIndex = store.memberships.findIndex(
        m => m.studentId === membership.studentId && m.classId === membership.classId
      );
      
      if (existingIndex >= 0) {
        store.memberships[existingIndex] = membership;
      } else {
        store.memberships.push(membership);
      }
    });
  }

  async delete(studentId: string, classId: string): Promise<void> {
    await updateStore(store => {
      store.memberships = store.memberships.filter(
        m => !(m.studentId === studentId && m.classId === classId)
      );
    });
  }
}

export class AssignmentRepository {
  async findByClass(classId: string): Promise<ClassAssignment[]> {
    const store = await loadClassroomStore();
    return store.assignments
      .filter(a => a.classId === classId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async findById(assignmentId: string): Promise<ClassAssignment | null> {
    const store = await loadClassroomStore();
    return store.assignments.find(a => a.id === assignmentId) || null;
  }

  async findByStudent(studentId: string): Promise<ClassAssignment[]> {
    const store = await loadClassroomStore();
    const classIds = store.memberships
      .filter(m => m.studentId === studentId)
      .map(m => m.classId);
    
    return store.assignments.filter(a => classIds.includes(a.classId));
  }

  async save(assignment: ClassAssignment): Promise<void> {
    await updateStore(store => {
      const existingIndex = store.assignments.findIndex(a => a.id === assignment.id);
      
      if (existingIndex >= 0) {
        store.assignments[existingIndex] = assignment;
      } else {
        store.assignments.unshift(assignment);
      }
    });
  }

  async delete(assignmentId: string): Promise<void> {
    await updateStore(store => {
      store.assignments = store.assignments.filter(a => a.id !== assignmentId);
    });
  }
}

export class CompletionRepository {
  async findByStudent(studentId: string): Promise<AssignmentCompletion[]> {
    const store = await loadClassroomStore();
    return store.completions.filter(c => c.studentId === studentId);
  }

  async findByAssignment(assignmentId: string): Promise<AssignmentCompletion[]> {
    const store = await loadClassroomStore();
    return store.completions.filter(c => c.assignmentId === assignmentId);
  }

  async find(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentCompletion | null> {
    const store = await loadClassroomStore();
    return store.completions.find(
      c => c.assignmentId === assignmentId && c.studentId === studentId
    ) || null;
  }

  async save(completion: AssignmentCompletion): Promise<void> {
    await updateStore(store => {
      const existingIndex = store.completions.findIndex(
        c => c.assignmentId === completion.assignmentId && c.studentId === completion.studentId
      );
      
      if (existingIndex >= 0) {
        store.completions[existingIndex] = completion;
      } else {
        store.completions.push(completion);
      }
    });
  }

  async delete(assignmentId: string, studentId: string): Promise<void> {
    await updateStore(store => {
      store.completions = store.completions.filter(
        c => !(c.assignmentId === assignmentId && c.studentId === studentId)
      );
    });
  }
}

export class ProgressRepository {
  async findByStudent(studentId: string): Promise<StudentProgressSnapshot | null> {
    const store = await loadClassroomStore();
    return store.progress[studentId] || null;
  }

  async save(progress: StudentProgressSnapshot): Promise<void> {
    await updateStore(store => {
      store.progress[progress.studentId] = progress;
    });
  }

  async delete(studentId: string): Promise<void> {
    await updateStore(store => {
      delete store.progress[studentId];
    });
  }

  async findAll(): Promise<StudentProgressSnapshot[]> {
    const store = await loadClassroomStore();
    return Object.values(store.progress);
  }
}

export class TeacherRepository {
  async findByEmail(email: string): Promise<TeacherGrant | null> {
    const store = await loadClassroomStore();
    return store.teachers[email.toLowerCase()] || null;
  }

  async findAll(): Promise<TeacherGrant[]> {
    const store = await loadClassroomStore();
    return Object.values(store.teachers);
  }

  async save(grant: TeacherGrant): Promise<void> {
    await updateStore(store => {
      store.teachers[grant.email] = grant;
    });
  }

  async delete(email: string): Promise<void> {
    await updateStore(store => {
      delete store.teachers[email.toLowerCase()];
    });
  }
}

// Singleton instances
export const classroomRepository = new ClassroomRepository();
export const membershipRepository = new MembershipRepository();
export const assignmentRepository = new AssignmentRepository();
export const completionRepository = new CompletionRepository();
export const progressRepository = new ProgressRepository();
export const teacherRepository = new TeacherRepository();
