import { ValidationError } from "./api-error-handler";
import type { GradeLevel } from "@/data/curriculum";
import { SUBJECT_CATALOG } from "@/data/curriculum";

export class AssignmentValidator {
  validateDueDate(dueDate: string): void {
    const date = new Date(dueDate);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
      throw new ValidationError("Invalid due date format");
    }
    
    if (date < now) {
      throw new ValidationError("Due date cannot be in the past");
    }
    
    const maxFuture = new Date();
    maxFuture.setFullYear(maxFuture.getFullYear() + 1);
    
    if (date > maxFuture) {
      throw new ValidationError("Due date cannot be more than 1 year in the future");
    }
  }
  
  validateTopic(topic: string, subjectId: string, grade: GradeLevel): void {
    if (!topic?.trim()) {
      throw new ValidationError("Topic is required");
    }
    
    if (topic.length > 200) {
      throw new ValidationError("Topic must be 200 characters or less");
    }
    
    // Validate subject exists
    const subject = SUBJECT_CATALOG.find(s => s.id === subjectId);
    if (!subject) {
      throw new ValidationError(`Invalid subject ID: ${subjectId}`);
    }
    
    // Validate topic exists for this subject and grade
    // This is a simplified check - in production you'd have a proper topic catalog
    const validTopics = this.getValidTopicsForSubject(subjectId, grade);
    if (!validTopics.includes(topic.toLowerCase())) {
      throw new ValidationError(`Invalid topic for subject ${subject.name} in grade ${grade}`);
    }
  }
  
  private getValidTopicsForSubject(subjectId: string, grade: GradeLevel): string[] {
    // This would normally come from your curriculum data
    // For now, return some common topics
    const commonTopics: Record<string, string[]> = {
      math: ['algebra', 'geometry', 'calculus', 'statistics', 'trigonometry'],
      chemistry: ['atomic structure', 'chemical bonding', 'periodic table', 'chemical reactions', 'organic chemistry'],
      physics: ['mechanics', 'thermodynamics', 'electricity', 'magnetism', 'waves'],
      biology: ['cells', 'genetics', 'ecology', 'evolution', 'human biology']
    };
    
    return commonTopics[subjectId] || [];
  }
  
  validateAssignmentType(type: string): void {
    if (!['lesson', 'exam_drill'].includes(type)) {
      throw new ValidationError("Assignment type must be 'lesson' or 'exam_drill'");
    }
  }
}

export class ClassValidator {
  validateClassName(name: string): void {
    if (!name?.trim()) {
      throw new ValidationError("Class name is required");
    }
    
    if (name.length > 80) {
      throw new ValidationError("Class name must be 80 characters or less");
    }
    
    if (name.trim().length === 0) {
      throw new ValidationError("Class name cannot be empty");
    }
  }
  
  validateGrade(grade: number): void {
    if (!Number.isInteger(grade)) {
      throw new ValidationError("Grade must be an integer");
    }
    
    if (grade < 9 || grade > 12) {
      throw new ValidationError("Grade must be between 9 and 12");
    }
  }
  
  validateSubjectIds(subjectIds: string[]): void {
    if (!Array.isArray(subjectIds)) {
      throw new ValidationError("Subject IDs must be an array");
    }
    
    if (subjectIds.length === 0) {
      throw new ValidationError("At least one subject is required");
    }
    
    if (subjectIds.length > 12) {
      throw new ValidationError("Maximum 12 subjects allowed");
    }
    
    // Validate each subject ID
    for (const subjectId of subjectIds) {
      if (!subjectId?.trim()) {
        throw new ValidationError("Subject ID cannot be empty");
      }
      
      const subject = SUBJECT_CATALOG.find(s => s.id === subjectId);
      if (!subject) {
        throw new ValidationError(`Invalid subject ID: ${subjectId}`);
      }
    }
  }
  
  validateJoinCode(joinCode: string): void {
    if (!joinCode?.trim()) {
      throw new ValidationError("Join code is required");
    }
    
    if (joinCode.length < 4 || joinCode.length > 10) {
      throw new ValidationError("Join code must be between 4 and 10 characters");
    }
    
    // Validate characters (alphanumeric only)
    if (!/^[A-Z0-9]+$/.test(joinCode.toUpperCase())) {
      throw new ValidationError("Join code must contain only letters and numbers");
    }
  }
}

export class StudentValidator {
  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email address");
    }
    
    if (email.length > 255) {
      throw new ValidationError("Email address must be 255 characters or less");
    }
  }
  
  validateGradeLevel(grade: number): void {
    if (!Number.isInteger(grade)) {
      throw new ValidationError("Grade level must be an integer");
    }
    
    if (grade < 9 || grade > 12) {
      throw new ValidationError("Grade level must be between 9 and 12");
    }
  }
  
  validateLearningLanguage(language: string): void {
    if (!['en', 'ar', 'mixed'].includes(language)) {
      throw new ValidationError("Learning language must be 'en', 'ar', or 'mixed'");
    }
  }
  
  validateStudyGoal(minutes: number): void {
    if (!Number.isInteger(minutes)) {
      throw new ValidationError("Study goal must be an integer");
    }
    
    if (minutes < 5 || minutes > 240) {
      throw new ValidationError("Daily study goal must be between 5 and 240 minutes");
    }
  }
  
  validateSchoolName(name: string): void {
    if (name && name.length > 200) {
      throw new ValidationError("School name must be 200 characters or less");
    }
  }
  
  validateCity(name: string): void {
    if (name && name.length > 100) {
      throw new ValidationError("City name must be 100 characters or less");
    }
  }
}

export class ProgressValidator {
  validateMastery(mastery: number): void {
    if (typeof mastery !== 'number') {
      throw new ValidationError("Mastery must be a number");
    }
    
    if (mastery < 0 || mastery > 100) {
      throw new ValidationError("Mastery must be between 0 and 100");
    }
  }
  
  validateExamAccuracy(accuracy: number): void {
    if (typeof accuracy !== 'number') {
      throw new ValidationError("Exam accuracy must be a number");
    }
    
    if (accuracy < 0 || accuracy > 100) {
      throw new ValidationError("Exam accuracy must be between 0 and 100");
    }
  }
  
  validateTimestamp(timestamp: string | null): void {
    if (timestamp === null) return;
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new ValidationError("Invalid timestamp format");
    }
  }
}

// Singleton instances
export const assignmentValidator = new AssignmentValidator();
export const classValidator = new ClassValidator();
export const studentValidator = new StudentValidator();
export const progressValidator = new ProgressValidator();
