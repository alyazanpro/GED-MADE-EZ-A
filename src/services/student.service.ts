import { ValidationError, NotFoundError } from "@/lib/api-error-handler";
import { createServiceClient } from "@/lib/supabase/server";
import { studentValidator } from "@/lib/validators";
import { logUserAction, AuditAction } from "@/lib/audit-logger";
import { emit, DomainEvent } from "@/lib/domain-events";
import type { AppUser } from "@/lib/auth-server";
import type { StudentRegistrationInput, UpdateStudentProfileInput } from "@/lib/validation-schemas";

export interface StudentProfile {
  studentId: string;
  email: string;
  name: string;
  gradeLevel: number;
  schoolName?: string;
  city?: string;
  learningLanguage: "en" | "ar" | "mixed";
  preferredSubjects?: string[];
  learningGoals?: string[];
  interests?: string[];
  studyTimePreference?: "morning" | "afternoon" | "evening" | "flexible";
  dailyStudyGoalMinutes?: number;
  registrationCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export class StudentService {
  async createProfile(
    user: AppUser,
    input: StudentRegistrationInput,
    request?: Request
  ): Promise<StudentProfile> {
    // Validate input
    this.validateRegistrationInput(input);
    
    const supabase = createServiceClient();
    
    // Check if profile already exists
    const { data: existing } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("student_id", user.id)
      .single();
    
    if (existing) {
      throw new ValidationError("Student profile already exists");
    }
    
    // Create profile
    const profileId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from("student_profiles")
      .insert({
        student_id: user.id,
        email: user.email,
        name: user.name,
        grade_level: input.gradeLevel,
        school_name: input.schoolName,
        city: input.city,
        learning_language: input.learningLanguage,
        preferred_subjects: input.preferredSubjects || [],
        learning_goals: input.learningGoals || [],
        interests: input.interests || [],
        study_time_preference: input.studyTimePreference,
        daily_study_goal_minutes: input.dailyStudyGoalMinutes || 30,
        registration_completed: true,
        onboarding_step: 5,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new ValidationError(`Failed to create profile: ${error.message}`);
    }
    
    // Emit domain event
    await emit(DomainEvent.USER_ONBOARDING_COMPLETED, {
      studentId: user.id,
      gradeLevel: input.gradeLevel,
      learningLanguage: input.learningLanguage
    }, user.id);
    
    // Audit logging
    await logUserAction(
      AuditAction.USER_REGISTER,
      user,
      "student_profile",
      user.id,
      { gradeLevel: input.gradeLevel, learningLanguage: input.learningLanguage },
      request
    );
    
    return this.mapToProfile(data);
  }
  
  async updateProfile(
    user: AppUser,
    input: UpdateStudentProfileInput,
    request?: Request
  ): Promise<StudentProfile> {
    // Validate input
    this.validateUpdateInput(input);
    
    const supabase = createServiceClient();
    
    // Check if profile exists
    const { data: existing } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("student_id", user.id)
      .single();
    
    if (!existing) {
      throw new NotFoundError("Student profile");
    }
    
    // Update profile
    const updateData: any = {};
    
    if (input.gradeLevel !== undefined) updateData.grade_level = input.gradeLevel;
    if (input.schoolName !== undefined) updateData.school_name = input.schoolName;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.learningLanguage !== undefined) updateData.learning_language = input.learningLanguage;
    if (input.preferredSubjects !== undefined) updateData.preferred_subjects = input.preferredSubjects;
    if (input.learningGoals !== undefined) updateData.learning_goals = input.learningGoals;
    if (input.interests !== undefined) updateData.interests = input.interests;
    if (input.studyTimePreference !== undefined) updateData.study_time_preference = input.studyTimePreference;
    if (input.dailyStudyGoalMinutes !== undefined) updateData.daily_study_goal_minutes = input.dailyStudyGoalMinutes;
    if (input.onboardingStep !== undefined) updateData.onboarding_step = input.onboardingStep;
    
    // Mark registration as completed if all required fields are present
    if (input.gradeLevel && input.learningLanguage && !existing.registration_completed) {
      updateData.registration_completed = true;
      updateData.completed_at = new Date().toISOString();
      updateData.onboarding_step = 5;
    }
    
    const { data, error } = await supabase
      .from("student_profiles")
      .update(updateData)
      .eq("student_id", user.id)
      .select()
      .single();
    
    if (error) {
      throw new ValidationError(`Failed to update profile: ${error.message}`);
    }
    
    // Emit domain event
    await emit(DomainEvent.USER_PROFILE_UPDATED, {
      studentId: user.id,
      updates: updateData
    }, user.id);
    
    // Audit logging
    await logUserAction(
      AuditAction.USER_PROFILE_UPDATE,
      user,
      "student_profile",
      user.id,
      updateData,
      request
    );
    
    return this.mapToProfile(data);
  }
  
  async getProfile(user: AppUser): Promise<StudentProfile | null> {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("student_id", user.id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.mapToProfile(data);
  }
  
  async getProfileById(studentId: string): Promise<StudentProfile | null> {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("student_id", studentId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.mapToProfile(data);
  }
  
  async deleteProfile(user: AppUser): Promise<void> {
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from("student_profiles")
      .delete()
      .eq("student_id", user.id);
    
    if (error) {
      throw new ValidationError(`Failed to delete profile: ${error.message}`);
    }
  }
  
  async getPersonalizedContent(user: AppUser): Promise<{
    recommendedSubjects: string[];
    suggestedTopics: Array<{ subjectId: string; topic: string }>;
    studySchedule: Array<{ day: string; suggestedMinutes: number }>;
  }> {
    const profile = await this.getProfile(user);
    
    if (!profile) {
      return {
        recommendedSubjects: [],
        suggestedTopics: [],
        studySchedule: []
      };
    }
    
    // Generate personalized recommendations based on profile
    const recommendedSubjects = profile.preferredSubjects?.length 
      ? profile.preferredSubjects 
      : this.getDefaultSubjectsForGrade(profile.gradeLevel);
    
    const suggestedTopics = this.generateSuggestedTopics(profile);
    const studySchedule = this.generateStudySchedule(profile);
    
    return {
      recommendedSubjects,
      suggestedTopics,
      studySchedule
    };
  }
  
  private validateRegistrationInput(input: StudentRegistrationInput): void {
    studentValidator.validateGradeLevel(input.gradeLevel);
    studentValidator.validateLearningLanguage(input.learningLanguage);
    
    if (input.schoolName) {
      studentValidator.validateSchoolName(input.schoolName);
    }
    
    if (input.city) {
      studentValidator.validateCity(input.city);
    }
    
    if (input.dailyStudyGoalMinutes) {
      studentValidator.validateStudyGoal(input.dailyStudyGoalMinutes);
    }
    
    if (input.preferredSubjects && input.preferredSubjects.length > 5) {
      throw new ValidationError("Maximum 5 preferred subjects allowed");
    }
    
    if (input.learningGoals && input.learningGoals.length > 5) {
      throw new ValidationError("Maximum 5 learning goals allowed");
    }
    
    if (input.interests && input.interests.length > 10) {
      throw new ValidationError("Maximum 10 interests allowed");
    }
  }
  
  private validateUpdateInput(input: UpdateStudentProfileInput): void {
    if (input.gradeLevel !== undefined) {
      studentValidator.validateGradeLevel(input.gradeLevel);
    }
    
    if (input.learningLanguage !== undefined) {
      studentValidator.validateLearningLanguage(input.learningLanguage);
    }
    
    if (input.schoolName !== undefined) {
      studentValidator.validateSchoolName(input.schoolName);
    }
    
    if (input.city !== undefined) {
      studentValidator.validateCity(input.city);
    }
    
    if (input.dailyStudyGoalMinutes !== undefined) {
      studentValidator.validateStudyGoal(input.dailyStudyGoalMinutes);
    }
    
    if (input.onboardingStep !== undefined) {
      if (input.onboardingStep < 0 || input.onboardingStep > 5) {
        throw new ValidationError("Onboarding step must be between 0 and 5");
      }
    }
  }
  
  private mapToProfile(data: any): StudentProfile {
    return {
      studentId: data.student_id,
      email: data.email,
      name: data.name,
      gradeLevel: data.grade_level,
      schoolName: data.school_name,
      city: data.city,
      learningLanguage: data.learning_language,
      preferredSubjects: data.preferred_subjects,
      learningGoals: data.learning_goals,
      interests: data.interests,
      studyTimePreference: data.study_time_preference,
      dailyStudyGoalMinutes: data.daily_study_goal_minutes,
      registrationCompleted: data.registration_completed,
      onboardingStep: data.onboarding_step,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at
    };
  }
  
  private getDefaultSubjectsForGrade(grade: number): string[] {
    // Default subjects based on grade level
    const defaults: Record<number, string[]> = {
      9: ["math", "chemistry", "physics", "biology", "english"],
      10: ["math", "chemistry", "physics", "biology", "english"],
      11: ["math", "chemistry", "physics", "biology", "english"],
      12: ["math", "chemistry", "physics", "biology", "english"]
    };
    
    return defaults[grade] || ["math", "chemistry"];
  }
  
  private generateSuggestedTopics(profile: StudentProfile): Array<{ subjectId: string; topic: string }> {
    // Generate suggested topics based on profile preferences
    const subjects = profile.preferredSubjects || this.getDefaultSubjectsForGrade(profile.gradeLevel);
    const suggestions: Array<{ subjectId: string; topic: string }> = [];
    
    // This would normally come from your curriculum data
    const topicSuggestions: Record<string, string[]> = {
      math: ["algebra basics", "geometry fundamentals", "equation solving"],
      chemistry: ["atomic structure", "chemical bonding", "periodic table"],
      physics: ["mechanics", "thermodynamics", "waves"],
      biology: ["cell structure", "genetics basics", "ecology"],
      english: ["grammar fundamentals", "essay writing", "reading comprehension"]
    };
    
    for (const subject of subjects) {
      const topics = topicSuggestions[subject] || [];
      for (const topic of topics.slice(0, 2)) {
        suggestions.push({ subjectId: subject, topic });
      }
    }
    
    return suggestions;
  }
  
  private generateStudySchedule(profile: StudentProfile): Array<{ day: string; suggestedMinutes: number }> {
    const dailyGoal = profile.dailyStudyGoalMinutes || 30;
    const preference = profile.studyTimePreference || "flexible";
    
    const schedule: Array<{ day: string; suggestedMinutes: number }> = [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    for (const day of days) {
      let suggestedMinutes = dailyGoal;
      
      // Adjust based on preference
      if (preference === "morning" && (day === "Saturday" || day === "Sunday")) {
        suggestedMinutes = Math.round(dailyGoal * 1.5); // Longer sessions on weekends
      } else if (preference === "flexible" && (day === "Saturday" || day === "Sunday")) {
        suggestedMinutes = Math.round(dailyGoal * 1.2);
      }
      
      schedule.push({ day, suggestedMinutes });
    }
    
    return schedule;
  }
}

// Singleton instance
export const studentService = new StudentService();
