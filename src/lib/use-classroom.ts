"use client";

import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/auth-storage";
import type {
  ClassAssignment,
  ClassInsights,
  ClassRoom,
  RosterStudent,
  StudentAssignmentView,
} from "@/lib/classroom-types";

async function authFetch(path: string, init?: RequestInit) {
  const token = getToken();
  if (!token) throw new Error("Not signed in.");
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export type ClassDetailPayload = {
  class: ClassRoom;
  roster: RosterStudent[];
  insights: ClassInsights;
  assignments: ClassAssignment[];
  completionStats: { assignmentId: string; completedCount: number; memberCount: number }[];
};

export function useClassroom() {
  const { user, loading: authLoading, refreshSession } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [canAccessConsole, setCanAccessConsole] = useState(false);
  const [claimOptions, setClaimOptions] = useState({
    domainEligible: false,
    emailEligible: false,
    inviteConfigured: false,
  });
  const [myClasses, setMyClasses] = useState<(ClassRoom & { joinedAt?: string })[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<ClassRoom[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignmentView[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsTeacher(false);
      setCanAccessConsole(false);
      setMyClasses([]);
      setTeacherClasses([]);
      setAssignments([]);
      setReady(false);
      return;
    }

    setError(null);
    try {
      const me = await authFetch("/api/teacher/me");
      setIsTeacher(Boolean(me.isTeacher));
      setCanAccessConsole(Boolean(me.canAccessConsole));
      setClaimOptions(me.claimOptions || {});

      const [studentClasses, asg] = await Promise.all([
        authFetch("/api/classes?role=student"),
        authFetch("/api/assignments"),
      ]);
      setMyClasses(studentClasses.classes || []);
      setAssignments(asg.assignments || []);

      if (me.canAccessConsole) {
        const teacher = await authFetch("/api/classes?role=teacher");
        setTeacherClasses(teacher.classes || []);
      } else {
        setTeacherClasses([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load classes.");
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const claimTeacher = useCallback(
    async (inviteCode?: string) => {
      await authFetch("/api/teacher/claim", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      });
      await refreshSession();
      await refresh();
    },
    [refresh, refreshSession]
  );

  const createClass = useCallback(
    async (input: { name: string; grade: number; subjectIds: string[] }) => {
      const res = await authFetch("/api/classes", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refresh();
      return res.class as ClassRoom;
    },
    [refresh]
  );

  const joinClass = useCallback(
    async (joinCode: string) => {
      const res = await authFetch("/api/classes/join", {
        method: "POST",
        body: JSON.stringify({ joinCode }),
      });
      await refresh();
      return res;
    },
    [refresh]
  );

  const loadClassDetail = useCallback(async (classId: string) => {
    return (await authFetch(`/api/classes/${classId}`)) as ClassDetailPayload;
  }, []);

  const loadStudentDetail = useCallback(async (classId: string, studentId: string) => {
    return authFetch(`/api/classes/${classId}?studentId=${encodeURIComponent(studentId)}`);
  }, []);

  const createAssignment = useCallback(
    async (
      classId: string,
      input: {
        type: "lesson" | "exam_drill";
        subjectId: string;
        topic: string;
        dueDate: string;
      }
    ) => {
      const res = await authFetch(`/api/classes/${classId}/assignments`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return res.assignment as ClassAssignment;
    },
    []
  );

  const completeAssignment = useCallback(
    async (assignmentId: string) => {
      await authFetch(`/api/assignments/${assignmentId}/complete`, { method: "POST" });
      await refresh();
    },
    [refresh]
  );

  return {
    ready,
    error,
    isTeacher,
    canAccessConsole,
    claimOptions,
    myClasses,
    teacherClasses,
    assignments,
    refresh,
    claimTeacher,
    createClass,
    joinClass,
    loadClassDetail,
    loadStudentDetail,
    createAssignment,
    completeAssignment,
  };
}
