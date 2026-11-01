"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, GraduationCap, Clock, Target, Heart, ChevronRight, ChevronLeft, Check, X } from "lucide-react";
import { SUBJECT_CATALOG, type GradeLevel } from "@/data/curriculum";
import type { StudentRegistrationInput } from "@/lib/validation-schemas";

interface Step {
  id: number;
  title: string;
  icon: any;
}

const steps: Step[] = [
  { id: 1, title: "Grade Level", icon: GraduationCap },
  { id: 2, title: "Learning Language", icon: BookOpen },
  { id: 3, title: "Preferred Subjects", icon: Target },
  { id: 4, title: "Study Preferences", icon: Clock },
  { id: 5, title: "Additional Info", icon: Heart },
];

const gradeLevels: GradeLevel[] = [9, 10, 11, 12];

const learningLanguages = [
  { value: "en", label: "English", description: "Full English instruction" },
  { value: "ar", label: "العربية", description: "Full Arabic instruction" },
  { value: "mixed", label: "Mixed", description: "English terms with Arabic explanation" },
];

const studyTimePreferences = [
  { value: "morning", label: "Morning", icon: "🌅" },
  { value: "afternoon", label: "Afternoon", icon: "☀️" },
  { value: "evening", label: "Evening", icon: "🌙" },
  { value: "flexible", label: "Flexible", icon: "📅" },
];

const commonInterests = [
  "Science", "Mathematics", "Languages", "Arts", "Sports", 
  "Technology", "History", "Geography", "Literature", "Music"
];

const commonLearningGoals = [
  "Pass GED exams", "Improve grades", "Learn new topics", 
  "Prepare for university", "Career preparation", "Personal growth"
];

interface StudentRegistrationFormProps {
  onComplete: (data: StudentRegistrationInput) => void;
  onCancel: () => void;
  initialData?: Partial<StudentRegistrationInput>;
}

export default function StudentRegistrationForm({ onComplete, onCancel, initialData = {} }: StudentRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<StudentRegistrationInput>({
    gradeLevel: initialData.gradeLevel || 9,
    learningLanguage: initialData.learningLanguage || "mixed",
    preferredSubjects: initialData.preferredSubjects || [],
    learningGoals: initialData.learningGoals || [],
    interests: initialData.interests || [],
    studyTimePreference: initialData.studyTimePreference,
    dailyStudyGoalMinutes: initialData.dailyStudyGoalMinutes || 30,
    schoolName: initialData.schoolName,
    city: initialData.city,
  });

  const updateFormData = (updates: Partial<StudentRegistrationInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await onComplete(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    const subjects = formData.preferredSubjects || [];
    if (subjects.includes(subjectId)) {
      updateFormData({ preferredSubjects: subjects.filter(s => s !== subjectId) });
    } else if (subjects.length < 5) {
      updateFormData({ preferredSubjects: [...subjects, subjectId] });
    }
  };

  const toggleLearningGoal = (goal: string) => {
    const goals = formData.learningGoals || [];
    if (goals.includes(goal)) {
      updateFormData({ learningGoals: goals.filter(g => g !== goal) });
    } else if (goals.length < 5) {
      updateFormData({ learningGoals: [...goals, goal] });
    }
  };

  const toggleInterest = (interest: string) => {
    const interests = formData.interests || [];
    if (interests.includes(interest)) {
      updateFormData({ interests: interests.filter(i => i !== interest) });
    } else if (interests.length < 10) {
      updateFormData({ interests: [...interests, interest] });
    }
  };

  const addCustomInterest = (interest: string) => {
    if (interest.trim() && (formData.interests || []).length < 10) {
      updateFormData({ interests: [...(formData.interests || []), interest.trim()] });
    }
  };

  const removeInterest = (interest: string) => {
    updateFormData({ interests: (formData.interests || []).filter(i => i !== interest) });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">What grade are you in?</h3>
            <p className="text-gray-600">Select your current grade level to personalize your learning experience.</p>
            
            <div className="grid grid-cols-2 gap-4">
              {gradeLevels.map((grade) => (
                <motion.button
                  key={grade}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateFormData({ gradeLevel: grade })}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.gradeLevel === grade
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="text-3xl font-bold mb-2">{grade}</div>
                  <div className="text-sm">Grade {grade}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Choose your learning language</h3>
            <p className="text-gray-600">Select the language you prefer for learning.</p>
            
            <div className="space-y-3">
              {learningLanguages.map((lang) => (
                <motion.button
                  key={lang.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateFormData({ learningLanguage: lang.value as any })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.learningLanguage === lang.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{lang.label}</div>
                      <div className="text-sm text-gray-600">{lang.description}</div>
                    </div>
                    {formData.learningLanguage === lang.value && (
                      <Check className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Select your preferred subjects</h3>
            <p className="text-gray-600">Choose up to 5 subjects you want to focus on.</p>
            
            <div className="grid grid-cols-2 gap-3">
              {SUBJECT_CATALOG.map((subject) => (
                <motion.button
                  key={subject.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSubject(subject.id)}
                  disabled={(formData.preferredSubjects || []).length >= 5 && !(formData.preferredSubjects || []).includes(subject.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    (formData.preferredSubjects || []).includes(subject.id)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  } ${(formData.preferredSubjects || []).length >= 5 && !(formData.preferredSubjects || []).includes(subject.id)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
                >
                  <div className="font-semibold">{subject.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(formData.preferredSubjects || []).includes(subject.id) ? "✓ Selected" : `+ Add`}
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              Selected: {(formData.preferredSubjects || []).length}/5 subjects
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Study preferences</h3>
            <p className="text-gray-600">Tell us about your study habits to create a personalized schedule.</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                When do you prefer to study?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {studyTimePreferences.map((pref) => (
                  <motion.button
                    key={pref.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateFormData({ studyTimePreference: pref.value as any })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.studyTimePreference === pref.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="text-2xl mb-1">{pref.icon}</div>
                    <div className="font-semibold">{pref.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Daily study goal (minutes): {formData.dailyStudyGoalMinutes}
              </label>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={formData.dailyStudyGoalMinutes}
                onChange={(e) => updateFormData({ dailyStudyGoalMinutes: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 min</span>
                <span>120 min</span>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Additional information</h3>
            <p className="text-gray-600">Optional details to help us personalize your experience further.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School name (optional)
                </label>
                <input
                  type="text"
                  value={formData.schoolName || ""}
                  onChange={(e) => updateFormData({ schoolName: e.target.value })}
                  placeholder="Enter your school name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City (optional)
                </label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => updateFormData({ city: e.target.value })}
                  placeholder="Enter your city"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning goals (select up to 5)
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonLearningGoals.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleLearningGoal(goal)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        (formData.learningGoals || []).includes(goal)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests (select up to 10)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {commonInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        (formData.interests || []).includes(interest)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.interests || []).map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 flex items-center gap-1"
                    >
                      {interest}
                      <button
                        onClick={() => removeInterest(interest)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8"
      >
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: currentStep === step.id ? 1.1 : 1,
                      backgroundColor: currentStep >= step.id ? "#3b82f6" : "#e5e7eb"
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </motion.div>
                  <span className="text-xs mt-2 text-gray-600 hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: currentStep > step.id ? "100%" : "0%" }}
                      className="h-full bg-blue-500 rounded"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {loading ? "Registering..." : "Complete Registration"}
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
