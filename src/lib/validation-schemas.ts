import { z } from "zod";

// General validation schemas
export const EmailSchema = z.string().email("Invalid email address").transform(val => val.toLowerCase().trim());

export const GradeLevelSchema = z.union([z.literal(9), z.literal(10), z.literal(11), z.literal(12)]);

export const SubjectIdSchema = z.string().min(1);

// Class validation schemas
export const CreateClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(80, "Class name must be 80 characters or less").trim(),
  grade: GradeLevelSchema,
  subjectIds: z.array(SubjectIdSchema).min(1, "At least one subject is required").max(12, "Maximum 12 subjects allowed")
});

export const JoinClassSchema = z.object({
  joinCode: z.string().min(4, "Join code must be at least 4 characters").max(10, "Join code must be 10 characters or less").trim().toUpperCase()
});

// Assignment validation schemas
export const CreateAssignmentSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  type: z.enum(["lesson", "exam_drill"]),
  subjectId: SubjectIdSchema,
  topic: z.string().min(1, "Topic is required").max(200, "Topic must be 200 characters or less").trim(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be YYYY-MM-DD format")
    .refine(date => {
      const parsed = new Date(date);
      const now = new Date();
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 1);
      return !isNaN(parsed.getTime()) && parsed >= now && parsed <= maxFuture;
    }, "Due date must be between today and 1 year in the future")
});

// Student registration validation schemas
export const StudentRegistrationSchema = z.object({
  gradeLevel: GradeLevelSchema,
  schoolName: z.string().max(200, "School name must be 200 characters or less").optional(),
  city: z.string().max(100, "City must be 100 characters or less").optional(),
  learningLanguage: z.enum(["en", "ar", "mixed"]),
  preferredSubjects: z.array(SubjectIdSchema).max(5, "Maximum 5 preferred subjects").optional(),
  learningGoals: z.array(z.string().max(100)).max(5, "Maximum 5 learning goals").optional(),
  interests: z.array(z.string().max(50)).max(10, "Maximum 10 interests").optional(),
  studyTimePreference: z.enum(["morning", "afternoon", "evening", "flexible"]).optional(),
  dailyStudyGoalMinutes: z.number().int().min(5).max(240).optional()
});

export const UpdateStudentProfileSchema = StudentRegistrationSchema.partial().extend({
  onboardingStep: z.number().int().min(0).max(5).optional()
});

// Teacher validation schemas
export const ClaimTeacherRoleSchema = z.object({
  inviteCode: z.string().min(4, "Invite code must be at least 4 characters").trim().optional()
});

export const GrantTeacherRoleSchema = z.object({
  email: EmailSchema
});

// Progress sync validation schemas
export const ProgressSyncSchema = z.object({
  topics: z.record(z.string(), z.object({
    mastery: z.number().min(0).max(100),
    completed: z.boolean(),
    lastStudiedAt: z.string().nullable()
  })).optional(),
  lastActiveAt: z.string().nullable().optional(),
  examFocusGrade: GradeLevelSchema.nullable().optional(),
  recentExamAccuracy: z.number().min(0).max(100).nullable().optional(),
  completedLesson: z.object({
    subjectId: SubjectIdSchema,
    topic: z.string()
  }).optional(),
  completedExamDrill: z.object({
    subjectId: SubjectIdSchema,
    topic: z.string()
  }).optional(),
  version: z.number().int().nonnegative().optional()
});

// API response schemas
export const ApiResponseSchema = z.object({
  error: z.string().optional(),
  code: z.string().optional(),
  data: z.any().optional()
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

// Type exports
export type CreateClassInput = z.infer<typeof CreateClassSchema>;
export type JoinClassInput = z.infer<typeof JoinClassSchema>;
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type StudentRegistrationInput = z.infer<typeof StudentRegistrationSchema>;
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileSchema>;
export type ClaimTeacherRoleInput = z.infer<typeof ClaimTeacherRoleSchema>;
export type GrantTeacherRoleInput = z.infer<typeof GrantTeacherRoleSchema>;
export type ProgressSyncInput = z.infer<typeof ProgressSyncSchema>;
