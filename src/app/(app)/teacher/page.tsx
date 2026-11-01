"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Copy,
  Check,
  Loader2,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  UserRound,
  ArrowLeft,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Button, Card } from "@/components/ui";
import {
  SUBJECT_CATALOG,
  GRADE_META,
  getTopicsForGrade,
  getSubject,
  type GradeLevel,
} from "@/data/curriculum";
import { useAuth } from "@/lib/auth-context";
import {
  useClassroom,
  type ClassDetailPayload,
} from "@/lib/use-classroom";
import type { ClassRoom, RosterStudent } from "@/lib/classroom-types";

function todayPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TeacherConsolePage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const {
    ready,
    canAccessConsole,
    claimOptions,
    teacherClasses,
    claimTeacher,
    createClass,
    loadClassDetail,
    loadStudentDetail,
    createAssignment,
    refresh,
  } = useClassroom();

  const [inviteCode, setInviteCode] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState<GradeLevel>(10);
  const [subjectIds, setSubjectIds] = useState<string[]>(["math"]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClassDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [asgType, setAsgType] = useState<"lesson" | "exam_drill">("lesson");
  const [asgSubject, setAsgSubject] = useState("math");
  const [asgTopic, setAsgTopic] = useState("");
  const [asgDue, setAsgDue] = useState(todayPlusDays(7));
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const [studentDetail, setStudentDetail] = useState<{
    membership: { studentName: string; studentEmail: string; joinedAt: string };
    progress: {
      overall?: number;
      lastActiveAt: string | null;
      recentExamAccuracy?: number | null;
      topics: Record<string, { mastery: number; lastStudiedAt: string | null }>;
    } | null;
    recentTopics: {
      subjectId: string;
      topic: string;
      mastery: number;
      lastStudiedAt: string | null;
    }[];
  } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth/signin");
  }, [user, loading, router]);

  const openClass = useCallback(
    async (classId: string) => {
      setSelectedId(classId);
      setStudentDetail(null);
      setDetailLoading(true);
      try {
        const data = await loadClassDetail(classId);
        setDetail(data);
        const firstSubject = data.class.subjectIds[0] || "math";
        setAsgSubject(firstSubject);
        const topics = getTopicsForGrade(
          getSubject(firstSubject)!,
          data.class.grade
        );
        setAsgTopic(topics[0] || "");
      } catch {
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [loadClassDetail]
  );

  useEffect(() => {
    if (!selectedId && teacherClasses[0]) {
      void openClass(teacherClasses[0].classId);
    }
  }, [teacherClasses, selectedId, openClass]);

  const topicsForAssign = useMemo(() => {
    const subject = getSubject(asgSubject);
    if (!subject || !detail) return [];
    return getTopicsForGrade(subject, detail.class.grade);
  }, [asgSubject, detail]);

  async function onClaim() {
    setClaiming(true);
    setClaimError(null);
    try {
      await claimTeacher(inviteCode || undefined);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Could not claim teacher role.");
    } finally {
      setClaiming(false);
    }
  }

  async function onCreateClass() {
    setCreating(true);
    setCreateError(null);
    try {
      const room = await createClass({ name, grade, subjectIds });
      setName("");
      await openClass(room.classId);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create class.");
    } finally {
      setCreating(false);
    }
  }

  async function onAssign() {
    if (!selectedId || !asgTopic) return;
    setAssigning(true);
    setAssignMsg(null);
    try {
      await createAssignment(selectedId, {
        type: asgType,
        subjectId: asgSubject,
        topic: asgTopic,
        dueDate: asgDue,
      });
      setAssignMsg("Assignment created — students will see it on their dashboard.");
      await openClass(selectedId);
    } catch (err) {
      setAssignMsg(err instanceof Error ? err.message : "Failed to assign.");
    } finally {
      setAssigning(false);
    }
  }

  async function onOpenStudent(student: RosterStudent) {
    if (!selectedId) return;
    try {
      const data = await loadStudentDetail(selectedId, student.studentId);
      setStudentDetail(data);
    } catch {
      setStudentDetail(null);
    }
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function toggleSubject(id: string) {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  if (loading || !ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!canAccessConsole) {
    return (
      <>
        <AppHeader
          title="Become a"
          highlight="teacher"
          subtitle="Create classes, share join codes, and see academic progress — not chat transcripts."
          showGreeting={false}
        />
        <Card className="mx-auto max-w-lg space-y-4">
          <p className="text-sm text-muted">
            Teacher access is separate from super-admin. Claim via invite code, school
            email domain, or ask a super admin to grant your email.
          </p>
          {(claimOptions.domainEligible || claimOptions.emailEligible) && (
            <Button onClick={() => void onClaim()} disabled={claiming}>
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Activate teacher access
            </Button>
          )}
          {claimOptions.inviteConfigured && (
            <div className="space-y-2">
              <label className="text-xs text-muted">Teacher invite code</label>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
                placeholder="Enter invite code"
              />
              <Button onClick={() => void onClaim()} disabled={claiming || !inviteCode.trim()}>
                {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Claim with code
              </Button>
            </div>
          )}
          {!claimOptions.inviteConfigured &&
            !claimOptions.domainEligible &&
            !claimOptions.emailEligible && (
              <p className="text-sm text-amber-300">
                No claim path is configured yet. A super admin can grant you from{" "}
                <Link href="/admin" className="underline">
                  /admin
                </Link>
                , or set <code className="text-xs">TEACHER_INVITE_CODE</code> /
                <code className="text-xs"> TEACHER_EMAIL_DOMAINS</code> in env.
              </p>
            )}
          {claimError && <p className="text-sm text-red-300">{claimError}</p>}
        </Card>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="Teacher"
        highlight="console"
        subtitle="Classes for Omani schools & tutors — roster, weak topics, assignments."
        showGreeting={false}
        action={
          isSuperAdmin ? (
            <Badge variant="info">Super admin can also manage classes</Badge>
          ) : (
            <Badge variant="success">Teacher</Badge>
          )
        }
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
              <Plus className="h-4 w-4 text-indigo-400" />
              New class
            </h3>
            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grade 10 Math — Section A"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50"
              />
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              >
                {([9, 10, 11, 12] as GradeLevel[]).map((g) => (
                  <option key={g} value={g} className="bg-[#121826]">
                    {GRADE_META[g].title}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_CATALOG.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSubject(s.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      subjectIds.includes(s.id)
                        ? "bg-indigo-500/30 text-indigo-200"
                        : "bg-white/5 text-muted"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              {createError && <p className="text-xs text-red-300">{createError}</p>}
              <Button
                size="sm"
                disabled={creating || !name.trim() || subjectIds.length === 0}
                onClick={() => void onCreateClass()}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create class
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-white">Your classes</h3>
            <div className="space-y-2">
              {teacherClasses.length === 0 && (
                <p className="text-sm text-muted">No classes yet — create one above.</p>
              )}
              {teacherClasses.map((c: ClassRoom) => (
                <button
                  key={c.classId}
                  type="button"
                  onClick={() => void openClass(c.classId)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedId === c.classId
                      ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                      : "border-white/5 bg-white/[0.02] text-muted hover:text-white"
                  }`}
                >
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="text-[10px] text-muted">
                    Grade {c.grade} · code {c.joinCode}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {detailLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          )}

          {!detailLoading && !detail && (
            <Card>
              <p className="text-sm text-muted">Select or create a class to see the roster.</p>
            </Card>
          )}

          {detail && !detailLoading && (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{detail.class.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      Grade {detail.class.grade} ·{" "}
                      {detail.class.subjectIds
                        .map((id) => getSubject(id)?.name || id)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                    <span className="text-xs text-muted">Join code</span>
                    <span className="font-mono text-lg font-bold tracking-widest text-emerald-300">
                      {detail.class.joinCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(detail.class.joinCode)}
                      className="rounded-lg p-1.5 text-emerald-300 hover:bg-white/5"
                      title="Copy code"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <p className="text-xs text-muted">Students</p>
                  <p className="mt-1 text-2xl font-bold text-white">{detail.roster.length}</p>
                </Card>
                <Card>
                  <p className="text-xs text-muted">Open assignments</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {detail.assignments.length}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-muted">Inactive &gt; 7 days</p>
                  <p className="mt-1 text-2xl font-bold text-amber-300">
                    {detail.insights.inactiveStudents.length}
                  </p>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <BookOpen className="h-4 w-4 text-cyan-400" />
                    Avg mastery by subject
                  </h3>
                  {detail.insights.averageMasteryBySubject.length === 0 ? (
                    <p className="text-sm text-muted">
                      Waiting for students to sync progress (study a lesson after joining).
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {detail.insights.averageMasteryBySubject.map((s) => (
                        <div key={s.subjectId}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-white">{s.subjectName}</span>
                            <span className="text-muted">
                              {s.averageMastery}% · {s.studentCount} students
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-cyan-400"
                              style={{ width: `${s.averageMastery}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Weak topics across class
                  </h3>
                  {detail.insights.weakTopics.length === 0 ? (
                    <p className="text-sm text-muted">
                      No weak topics yet — appears once members have topic mastery &lt; 70%.
                    </p>
                  ) : (
                    <ul className="max-h-56 space-y-2 overflow-y-auto scrollbar-thin">
                      {detail.insights.weakTopics.map((t) => (
                        <li
                          key={`${t.subjectId}::${t.topic}`}
                          className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-white">{t.topic}</p>
                            <p className="text-[10px] text-muted">{t.subjectName}</p>
                          </div>
                          <Badge variant="warning">{t.averageMastery}%</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>

              {detail.insights.inactiveStudents.length > 0 && (
                <Card>
                  <h3 className="mb-3 font-semibold text-white">Inactive students (&gt; 7 days)</h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.insights.inactiveStudents.map((s) => (
                      <Badge key={s.studentId} variant="danger">
                        {s.studentName} · {s.daysInactive === 999 ? "never" : `${s.daysInactive}d`}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-white">
                      <Users className="h-4 w-4 text-indigo-400" />
                      Roster
                    </h3>
                    <Badge>{detail.roster.length}</Badge>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin">
                    {detail.roster.length === 0 && (
                      <p className="text-sm text-muted">
                        Share the join code — students enter it on their dashboard.
                      </p>
                    )}
                    {detail.roster.map((s) => (
                      <button
                        key={s.studentId}
                        type="button"
                        onClick={() => void onOpenStudent(s)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-left hover:border-indigo-500/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{s.studentName}</p>
                          <p className="truncate text-[10px] text-muted">{s.studentEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-indigo-300">
                            {s.overallMastery}%
                          </p>
                          <p className="text-[10px] text-muted">{s.topicsStudied} topics</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                    <ClipboardList className="h-4 w-4 text-emerald-400" />
                    Assign work
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAsgType("lesson")}
                        className={`rounded-full px-3 py-1.5 text-xs ${
                          asgType === "lesson"
                            ? "bg-emerald-500/25 text-emerald-200"
                            : "bg-white/5 text-muted"
                        }`}
                      >
                        Lesson topic
                      </button>
                      <button
                        type="button"
                        onClick={() => setAsgType("exam_drill")}
                        className={`rounded-full px-3 py-1.5 text-xs ${
                          asgType === "exam_drill"
                            ? "bg-emerald-500/25 text-emerald-200"
                            : "bg-white/5 text-muted"
                        }`}
                      >
                        Exam drill
                      </button>
                    </div>
                    <select
                      value={asgSubject}
                      onChange={(e) => {
                        setAsgSubject(e.target.value);
                        const sub = getSubject(e.target.value);
                        if (sub && detail) {
                          const topics = getTopicsForGrade(sub, detail.class.grade);
                          setAsgTopic(topics[0] || "");
                        }
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      {detail.class.subjectIds.map((id) => (
                        <option key={id} value={id} className="bg-[#121826]">
                          {getSubject(id)?.name || id}
                        </option>
                      ))}
                    </select>
                    <select
                      value={asgTopic}
                      onChange={(e) => setAsgTopic(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      {topicsForAssign.map((t) => (
                        <option key={t} value={t} className="bg-[#121826]">
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={asgDue}
                      onChange={(e) => setAsgDue(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    />
                    <Button size="sm" disabled={assigning || !asgTopic} onClick={() => void onAssign()}>
                      {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Assign to class
                    </Button>
                    {assignMsg && <p className="text-xs text-muted">{assignMsg}</p>}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                    {detail.assignments.length === 0 && (
                      <p className="text-sm text-muted">No assignments yet.</p>
                    )}
                    {detail.assignments.map((a) => {
                      const stats = detail.completionStats.find((c) => c.assignmentId === a.id);
                      return (
                        <div
                          key={a.id}
                          className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
                        >
                          <p className="text-white">{a.topic}</p>
                          <p className="text-[10px] text-muted">
                            {a.type === "lesson" ? "Lesson" : "Exam drill"} · due {a.dueDate} ·{" "}
                            {stats ? `${stats.completedCount}/${stats.memberCount} done` : ""}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {studentDetail && (
                <Card>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-white">
                      <UserRound className="h-4 w-4 text-violet-400" />
                      {studentDetail.membership.studentName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStudentDetail(null)}
                      className="text-xs text-muted hover:text-white"
                    >
                      <ArrowLeft className="mr-1 inline h-3 w-3" />
                      Close
                    </button>
                  </div>
                  <p className="text-xs text-muted">{studentDetail.membership.studentEmail}</p>
                  <p className="mt-1 text-xs text-muted">
                    Last active:{" "}
                    {studentDetail.progress?.lastActiveAt
                      ? new Date(studentDetail.progress.lastActiveAt).toLocaleString()
                      : "No activity synced yet"}
                    {typeof studentDetail.progress?.recentExamAccuracy === "number"
                      ? ` · Exam (7d): ${studentDetail.progress.recentExamAccuracy}%`
                      : ""}
                  </p>
                  <p className="mt-3 text-[11px] text-muted">
                    Academic progress only — tutor chat is private.
                  </p>
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
                    {studentDetail.recentTopics.length === 0 && (
                      <li className="text-sm text-muted">No topic progress yet.</li>
                    )}
                    {studentDetail.recentTopics.map((t) => (
                      <li
                        key={`${t.subjectId}-${t.topic}`}
                        className="flex justify-between gap-2 rounded-lg border border-white/5 px-3 py-2 text-sm"
                      >
                        <span className="truncate text-white">{t.topic}</span>
                        <Badge>{t.mastery}%</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <button
                type="button"
                onClick={() => {
                  void refresh().then(() => {
                    if (selectedId) void openClass(selectedId);
                  });
                }}
                className="text-xs text-indigo-400 hover:underline"
              >
                Refresh class data
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
