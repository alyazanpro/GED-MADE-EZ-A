"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Button, Card } from "@/components/ui";
import {
  GRADE_META,
  getSubject,
  type GradeLevel,
} from "@/data/curriculum";
import {
  countExamQuestions,
  defaultMockCount,
  defaultTimeLimitSec,
  examDrillHref,
  getExamCoverage,
  hasArabicExamFields,
  listExamGrades,
  listExamSubjects,
  listExamTopics,
  resolveExamTopic,
  EXAM_BANK,
} from "@/data/exam-bank";
import type { ExamMode } from "@/data/exam-bank/types";
import { useUserData } from "@/lib/use-user-data";
import {
  buildWeakTopics,
  computeReadiness,
  daysUntilExam,
} from "@/lib/user-data";
import {
  ClipboardCheck,
  Clock,
  Layers,
  Target,
  Timer,
  ArrowRight,
  Languages,
} from "lucide-react";

function ExamsHubInner() {
  const params = useSearchParams();
  const { data, ready } = useUserData();
  const subjects = listExamSubjects();

  const paramSubject = params.get("subject") || "";
  const paramGrade = Number(params.get("grade")) as GradeLevel;
  const paramMode = params.get("mode") as ExamMode | null;
  const paramTopic = params.get("topic") || "";

  const [subjectId, setSubjectId] = useState(
    subjects.includes(paramSubject) ? paramSubject : subjects[0] || "math"
  );
  const grades = listExamGrades(subjectId);
  const [grade, setGrade] = useState<GradeLevel>(
    grades.includes(paramGrade)
      ? paramGrade
      : (data.examFocusGrade && grades.includes(data.examFocusGrade)
          ? data.examFocusGrade
          : grades[0]) || 9
  );
  const [arabicOnly, setArabicOnly] = useState(false);
  const topicsAll = listExamTopics(subjectId, grade);
  const topics = arabicOnly
    ? topicsAll.filter((t) =>
        EXAM_BANK.some(
          (q) =>
            q.subjectId === subjectId &&
            q.grade === grade &&
            q.topic === t &&
            hasArabicExamFields(q)
        )
      )
    : topicsAll;
  const [topic, setTopic] = useState(() => {
    if (paramTopic) {
      return resolveExamTopic(subjectId, paramTopic, grade);
    }
    return topics[0] || "";
  });
  const [mode, setMode] = useState<ExamMode>(
    paramMode === "topic" || paramMode === "mixed" || paramMode === "mock"
      ? paramMode
      : "mock"
  );
  const [timed, setTimed] = useState(true);
  const [count, setCount] = useState(defaultMockCount(grade));

  // Sync from deep-link query once ready
  useEffect(() => {
    if (!ready) return;
    if (paramSubject && subjects.includes(paramSubject)) {
      setSubjectId(paramSubject);
      const gs = listExamGrades(paramSubject);
      const g = gs.includes(paramGrade)
        ? paramGrade
        : gs[0] || 9;
      setGrade(g);
      const ts = listExamTopics(paramSubject, g);
      if (paramTopic) {
        const resolved = resolveExamTopic(paramSubject, paramTopic, g);
        setTopic(ts.includes(resolved) ? resolved : ts[0] || "");
      } else {
        setTopic(ts[0] || "");
      }
    }
    if (paramMode === "topic" || paramMode === "mixed" || paramMode === "mock") {
      setMode(paramMode);
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const coverage = useMemo(
    () => getExamCoverage(subjectId, grade),
    [subjectId, grade]
  );

  const bankCount = countExamQuestions({
    subjectId,
    grade,
    topic: mode === "topic" ? topic : undefined,
    requireArabic: arabicOnly || undefined,
  });
  const readiness = useMemo(
    () => (ready ? computeReadiness(data, grade) : null),
    [data, grade, ready]
  );
  const weak = useMemo(
    () => (ready ? buildWeakTopics(data, grade) : []),
    [data, grade, ready]
  );
  const daysLeft = ready ? daysUntilExam(data) : null;

  // Coverage meters for all subjects at current grade
  const subjectMeters = useMemo(() => {
    return subjects.map((id) => {
      const c = getExamCoverage(id, grade);
      return { id, ...c, name: getSubject(id)?.name || id };
    });
  }, [subjects, grade]);

  if (!ready) {
    return <div className="py-20 text-center text-muted">Loading Exam OS…</div>;
  }

  const startHref = examDrillHref({
    subjectId,
    grade,
    topic: mode === "topic" ? topic : undefined,
    mode,
    count: mode === "mock" ? defaultMockCount(grade) : count,
    timed: mode === "mock" ? true : timed,
    requireArabic: arabicOnly || undefined,
  });

  return (
    <>
      <AppHeader
        title="MoE Exam"
        highlight="Operating System"
        subtitle="Exam-style practice mapped to Oman Grades 9–12 — not a general video library."
        showGreeting={false}
        action={
          daysLeft != null ? (
            <Badge variant={daysLeft <= 14 ? "danger" : daysLeft <= 40 ? "warning" : "default"}>
              {daysLeft < 0
                ? `${Math.abs(daysLeft)}d past target`
                : `${daysLeft}d to exam`}
            </Badge>
          ) : (
            <Link href="/planner">
              <Button size="sm" variant="secondary">
                Set exam date
              </Button>
            </Link>
          )
        }
      />

      {readiness && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted">Readiness · Grade {grade}</p>
              <p className="mt-1 text-3xl font-bold text-white">
                {readiness.score}
                <span className="text-lg text-muted">/10</span>
              </p>
              <p className="mt-1 max-w-xl text-[11px] text-muted">
                {readiness.formulaLabel}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Mastery", v: readiness.topicMastery },
                { label: "Exam 7d", v: readiness.examAccuracy7d },
                { label: "Coverage", v: readiness.coverage },
                { label: "Recency", v: readiness.recency },
              ].map((x) => (
                <div
                  key={x.label}
                  className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-center"
                >
                  <p className="text-[10px] text-muted">{x.label}</p>
                  <p className="text-sm font-semibold text-white">{x.v}%</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {data.examSessions.length === 0 && (
        <Card className="mb-6 border-dashed border-white/15 bg-white/[0.02]">
          <h3 className="font-semibold text-white">No exam attempts yet</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Readiness isn&apos;t a vibe score. It needs inputs: topic mastery from
            lessons, exam accuracy from drills/mocks, how much of your grade you&apos;ve
            covered, and how recently you practiced. Start a topic drill (5 questions)
            or a timed mock below — weak topics will appear with lesson + practice links.
          </p>
          <p className="mt-3 text-xs text-muted">
            Tip: set your target exam date in Planner so the hub can countdown.
          </p>
        </Card>
      )}

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-white">
          Bank coverage · Grade {grade}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {subjectMeters.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSubjectId(m.id);
                const gs = listExamGrades(m.id);
                const g = gs.includes(grade) ? grade : gs[0];
                setGrade(g);
                const ts = listExamTopics(m.id, g);
                setTopic(ts[0] || "");
              }}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                subjectId === m.id
                  ? "border-indigo-400/40 bg-indigo-500/15"
                  : "border-white/8 bg-white/[0.02] hover:border-white/15"
              }`}
            >
              <p className="text-sm font-medium text-white">{m.name}</p>
              <p className="text-[11px] text-muted">
                {m.questionCount} questions · {m.topicCount} topics covered
                {m.arabicCount > 0 ? ` · ${m.arabicCount} with Arabic` : ""}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-400/70"
                  style={{
                    width: `${Math.min(100, (m.topicCount / 6) * 100)}%`,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-white">Start practice</h3>
            <label className="flex items-center gap-2 text-xs text-white/80">
              <input
                type="checkbox"
                checked={arabicOnly}
                onChange={(e) => {
                  setArabicOnly(e.target.checked);
                  if (e.target.checked) {
                    const arTopics = topicsAll.filter((t) =>
                      EXAM_BANK.some(
                        (q) =>
                          q.subjectId === subjectId &&
                          q.grade === grade &&
                          q.topic === t &&
                          hasArabicExamFields(q)
                      )
                    );
                    if (arTopics.length && !arTopics.includes(topic)) {
                      setTopic(arTopics[0]);
                    }
                  }
                }}
                className="rounded"
              />
              <Languages className="h-3.5 w-3.5" />
              Has Arabic fields
            </label>
          </div>

          <p className="text-[11px] text-muted">
            {coverage.questionCount} questions · {coverage.topicCount} topics
            covered
            {coverage.arabicCount > 0
              ? ` · ${coverage.arabicCount} bilingual`
              : ""}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted">
              Subject
              <select
                value={subjectId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSubjectId(id);
                  const gs = listExamGrades(id);
                  const g = gs.includes(grade) ? grade : gs[0];
                  setGrade(g);
                  const ts = listExamTopics(id, g);
                  setTopic(ts[0] || "");
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
              >
                {subjects.map((id) => (
                  <option key={id} value={id} className="bg-[#121826]">
                    {getSubject(id)?.name || id}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-muted">
              Grade
              <select
                value={grade}
                onChange={(e) => {
                  const g = Number(e.target.value) as GradeLevel;
                  setGrade(g);
                  setCount(defaultMockCount(g));
                  const ts = listExamTopics(subjectId, g);
                  setTopic(ts[0] || "");
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
              >
                {grades.map((g) => (
                  <option key={g} value={g} className="bg-[#121826]">
                    {GRADE_META[g].title} · {GRADE_META[g].stage.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                {
                  id: "topic" as const,
                  title: "Topic drill",
                  icon: Target,
                  blurb: "Focus one MoE topic",
                },
                {
                  id: "mixed" as const,
                  title: "Mixed paper",
                  icon: Layers,
                  blurb: "Weak-topic mix",
                },
                {
                  id: "mock" as const,
                  title: "Mock mini-paper",
                  icon: ClipboardCheck,
                  blurb: "Timed score + review",
                },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  if (m.id === "mock") {
                    setTimed(true);
                    setCount(defaultMockCount(grade));
                  }
                }}
                className={`rounded-xl border p-3 text-left transition ${
                  mode === m.id
                    ? "border-indigo-400/40 bg-indigo-500/15"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15"
                }`}
              >
                <m.icon className="mb-2 h-4 w-4 text-indigo-300" />
                <p className="text-sm font-medium text-white">{m.title}</p>
                <p className="text-[11px] text-muted">{m.blurb}</p>
              </button>
            ))}
          </div>

          {mode === "topic" && (
            <label className="block text-xs text-muted">
              Topic
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
              >
                {topics.map((t) => (
                  <option key={t} value={t} className="bg-[#121826]">
                    {t} (
                    {countExamQuestions({
                      subjectId,
                      grade,
                      topic: t,
                      requireArabic: arabicOnly || undefined,
                    })}{" "}
                    Qs)
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex flex-wrap items-end gap-3">
            {mode !== "mock" && (
              <>
                <label className="text-xs text-muted">
                  Questions
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value) || 5)}
                    className="mt-1 block w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={timed}
                    onChange={(e) => setTimed(e.target.checked)}
                    className="rounded"
                  />
                  <Timer className="h-3.5 w-3.5" />
                  Timed (~{Math.round(defaultTimeLimitSec(count) / 60)} min)
                </label>
              </>
            )}
            {mode === "mock" && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Clock className="h-4 w-4" />
                {defaultMockCount(grade)} questions · timed mini-paper
              </p>
            )}
            <div className="ml-auto">
              <Link href={bankCount === 0 ? "#" : startHref}>
                <Button disabled={bankCount === 0}>
                  Start session
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-[11px] text-muted">
            Bank: {bankCount} question{bankCount === 1 ? "" : "s"} for this
            selection (original exam-style items aligned to MoE topics).
            Language follows your preference ({data.learningLanguage}).
          </p>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-white">Weak topics</h3>
          {weak.length === 0 ? (
            <p className="text-sm text-muted">
              Run a mock or drill — failed topics land here with lesson + exam
              links.
            </p>
          ) : (
            <div className="space-y-2">
              {weak.slice(0, 5).map((w) => (
                <div
                  key={`${w.subjectId}-${w.topic}`}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <p className="text-sm text-white">{w.topic}</p>
                  <p className="text-[11px] text-muted">
                    {w.subjectName} · mastery {w.mastery}%
                    {w.examAccuracy != null ? ` · exam ${w.examAccuracy}%` : ""}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Link
                      href={w.lessonHref}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      Lesson
                    </Link>
                    <Link href={w.drillHref} className="text-[11px] text-emerald-400 hover:underline">
                      Practice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {data.examSessions.length > 0 && (
        <Card>
          <h3 className="mb-4 font-semibold text-white">Recent exam sessions</h3>
          <div className="space-y-2">
            {data.examSessions.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm text-white">
                    {getSubject(s.subjectId)?.name} · G{s.grade} · {s.mode}
                  </p>
                  <p className="text-[11px] text-muted">
                    {s.correctCount}/{s.total} · {s.accuracy}%
                    {s.timed ? " · timed" : ""}
                  </p>
                </div>
                <Badge variant={s.accuracy >= 70 ? "success" : "warning"}>
                  {s.marksEarned}/{s.marksTotal} marks
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

export default function ExamsHubPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted">Loading Exam OS…</div>
      }
    >
      <ExamsHubInner />
    </Suspense>
  );
}
