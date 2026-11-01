import type { GradeLevel } from "@/data/curriculum";

export type TeacherGrant = {
  email: string;
  grantedAt: string;
  /** admin | invite | domain */
  source: "admin" | "invite" | "domain";
  grantedBy?: string;
};

export type ClassRoom = {
  classId: string;
  name: string;
  grade: GradeLevel;
  subjectIds: string[];
  joinCode: string;
  teacherId: string;
  teacherEmail: string;
  teacherName: string;
  createdAt: string;
};

export type ClassMembership = {
  studentId: string;
  studentEmail: string;
  studentName: string;
  classId: string;
  joinedAt: string;
};

export type AssignmentType = "lesson" | "exam_drill";

export type ClassAssignment = {
  id: string;
  classId: string;
  type: AssignmentType;
  subjectId: string;
  topic: string;
  /** Precomputed slug for lesson links */
  topicSlug: string;
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
  createdBy: string;
};

export type AssignmentCompletion = {
  assignmentId: string;
  studentId: string;
  completedAt: string;
};

/** Academic-only snapshot — never includes tutor chat transcripts */
export type TopicSnapshot = {
  mastery: number;
  completed: boolean;
  lastStudiedAt: string | null;
};

export type StudentProgressSnapshot = {
  studentId: string;
  studentEmail: string;
  studentName: string;
  updatedAt: string;
  lastActiveAt: string | null;
  topics: Record<string, TopicSnapshot>;
  examFocusGrade: GradeLevel | null;
  /** Rolling 7-day exam session accuracy when available */
  recentExamAccuracy?: number | null;
  /** Version for optimistic locking */
  version?: number;
};

export type ClassroomStore = {
  teachers: Record<string, TeacherGrant>;
  classes: Record<string, ClassRoom>;
  memberships: ClassMembership[];
  assignments: ClassAssignment[];
  completions: AssignmentCompletion[];
  progress: Record<string, StudentProgressSnapshot>;
};

export type ClassInsights = {
  averageMasteryBySubject: {
    subjectId: string;
    subjectName: string;
    averageMastery: number;
    studentCount: number;
  }[];
  weakTopics: {
    subjectId: string;
    subjectName: string;
    topic: string;
    averageMastery: number;
    studentCount: number;
  }[];
  inactiveStudents: {
    studentId: string;
    studentEmail: string;
    studentName: string;
    lastActiveAt: string | null;
    daysInactive: number;
  }[];
};

export type RosterStudent = {
  studentId: string;
  studentEmail: string;
  studentName: string;
  joinedAt: string;
  lastActiveAt: string | null;
  overallMastery: number;
  topicsStudied: number;
};

export type StudentAssignmentView = ClassAssignment & {
  className: string;
  completed: boolean;
  completedAt: string | null;
  href: string;
};
