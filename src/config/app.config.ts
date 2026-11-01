import { isSuperAdminEmail } from "@/lib/admin";

export const appConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  },
  
  auth: {
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL || "abhimandewangan29@gmail.com",
    tokenExpiryHours: 24,
    sessionTimeoutMinutes: 30
  },
  
  features: {
    aiTutor: {
      enabled: Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
      provider: process.env.OPENAI_API_KEY ? "openai" : process.env.GEMINI_API_KEY ? "gemini" : "none",
      maxChunks: 6,
      temperature: 0.2
    },
    teacher: {
      maxClassesPerTeacher: 50,
      maxStudentsPerClass: 100,
      maxAssignmentsPerClass: 50
    },
    student: {
      maxPersonalBooks: 10,
      maxDailyStudyMinutes: 240,
      minDailyStudyMinutes: 5
    },
    registration: {
      enabled: true,
      requireSchoolInfo: false,
      requireCityInfo: false
    }
  },
  
  sync: {
    debounceMs: 1500,
    retryAttempts: 3,
    retryDelayMs: 1000,
    offlineEnabled: true,
    conflictStrategy: "most_recent" as const
  },
  
  cache: {
    defaultTtl: 300000, // 5 minutes
    userTtl: 300000,
    classTtl: 600000, // 10 minutes
    curriculumTtl: 3600000, // 1 hour
    sessionTtl: 900000 // 15 minutes
  },
  
  rateLimit: {
    auth: {
      windowMs: 900000, // 15 minutes
      maxRequests: 5
    },
    general: {
      windowMs: 60000, // 1 minute
      maxRequests: 60
    },
    strict: {
      windowMs: 60000, // 1 minute
      maxRequests: 10
    },
    writeOperations: {
      windowMs: 60000, // 1 minute
      maxRequests: 20
    }
  },
  
  performance: {
    slowOperationThreshold: 1000, // 1 second
    maxMetricsStored: 1000
  },
  
  logging: {
    level: (process.env.LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info",
    environment: process.env.NODE_ENV || "development"
  },
  
  validation: {
    maxClassNameLength: 80,
    maxTopicLength: 200,
    maxSchoolNameLength: 200,
    maxCityNameLength: 100,
    maxSubjectsPerClass: 12,
    maxPreferredSubjects: 5,
    maxLearningGoals: 5,
    maxInterests: 10
  },
  
  curriculum: {
    grades: [9, 10, 11, 12] as const,
    defaultExamFocusGrade: 9,
    languages: ["en", "ar", "mixed"] as const
  }
} as const;

export function isSuperAdmin(email: string): boolean {
  return isSuperAdminEmail(email);
}

export function isConfigured(): boolean {
  return Boolean(
    appConfig.supabase.url &&
    appConfig.supabase.anonKey &&
    appConfig.supabase.serviceRoleKey
  );
}

export function getAiTutorProvider(): "openai" | "gemini" | "none" {
  return appConfig.features.aiTutor.provider;
}

export function isAiTutorEnabled(): boolean {
  return appConfig.features.aiTutor.enabled;
}
