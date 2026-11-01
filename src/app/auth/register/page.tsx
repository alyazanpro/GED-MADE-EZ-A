"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentRegistrationForm from "@/components/student-registration-form";
import type { StudentRegistrationInput } from "@/lib/validation-schemas";
import { getToken } from "@/lib/auth-storage";
import { apiUrl } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      router.push("/auth/signin");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const handleRegistration = async (data: StudentRegistrationInput) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(apiUrl("/api/student/registration"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const result = await response.json();
      
      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <StudentRegistrationForm
      onComplete={handleRegistration}
      onCancel={handleCancel}
    />
  );
}
