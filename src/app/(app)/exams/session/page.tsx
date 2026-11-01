"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { getSubject, type GradeLevel } from "@/data/curriculum";
import {
  defaultMockCount,
  defaultTimeLimitSec,
  gradeExamAnswer,
  lessonHref,
  pickExamQuestions,
  resolveExamTopic,
  resolveExamView,
} from "@/data/exam-bank";
import type { ExamMode, ExamQuestion } from "@/data/exam-bank/types";
import { useUserData } from "@/lib/use-user-data";
import { buildWeakTopics } from "@/lib/user-data";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import { Suspense } from "react";

type AnswerState = {
  value: string;
  selfMark?: boolean;
  revealed: boolean;
  correct: boolean | null;
};

function ExamSessionInner() {
  const params = useSearchParams();
  const { data, ready, saveExamSession } = useUserData();
  const language = data.learningLanguage ?? "mixed";

  const subjectId = params.get("subject") || "math";
  const grade = (Number(params.get("grade")) || 9) as GradeLevel;
  const mode = (params.get("mode") || "mock") as ExamMode;
  const topicRaw = params.get("topic") || undefined;
  const topic = topicRaw
    ? resolveExamTopic(subjectId, topicRaw, grade)
    : undefined;
  const countParam = Number(params.get("count"));
  const timed = params.get("timed") === "1" || mode === "mock";
  const requireArabic = params.get("ar") === "1";
  const count =
    countParam ||
    (mode === "mock" ? defaultMockCount(grade) : mode === "topic" ? 5 : 10);

  const preferTopics = useMemo(() => {
    if (mode !== "mixed") return undefined;
    return buildWeakTopics(data, grade)
      .filter((w) => w.subjectId === subjectId)
      .map((w) => w.topic)
      .slice(0, 4);
  }, [data, grade, mode, subjectId]);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [startedAt] = useState(() => Date.now());
  const [remaining, setRemaining] = useState(
    timed ? defaultTimeLimitSec(count) : null
  );
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const recentIds = data.examAnswers.slice(0, 40).map((a) => a.questionId);
    const picked = pickExamQuestions({
      subjectId,
      grade,
      topic: mode === "topic" ? topic : undefined,
      count,
      preferTopics,
      excludeIds: recentIds,
      requireArabic: requireArabic || undefined,
    });
    setQuestions(picked);
    setIdx(0);
    setAnswers({});
    setFinished(false);
    setSaved(false);
    if (timed) setRemaining(defaultTimeLimitSec(picked.length || count));
  }, [ready, subjectId, grade, mode, topic, count, timed]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    setFinished(true);
  }, []);

  useEffect(() => {
    if (!timed || remaining == null || finished) return;
    if (remaining <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => (r == null ? r : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [remaining, timed, finished, finish]);

  const q = questions[idx];
  const view = q ? resolveExamView(q, language) : null;

  function revealCurrent() {
    if (!q) return;
    const state = answers[q.id];
    const userAnswer = state?.value ?? "";
    const correct = gradeExamAnswer(q, userAnswer, state?.selfMark);
    setAnswers((prev) => ({
      ...prev,
      [q.id]: {
        value: userAnswer,
        selfMark: state?.selfMark,
        revealed: true,
        correct,
      },
    }));
  }

  function saveAll() {
    if (saved || questions.length === 0) return;
    const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const payload = questions.map((question) => {
      const a = answers[question.id];
      const userAnswer = a?.value ?? "";
      const correct =
        a?.correct ??
        gradeExamAnswer(question, userAnswer, a?.selfMark);
      return {
        questionId: question.id,
        correct,
        userAnswer,
        topic: question.topic,
        marks: question.marks,
        marksEarned: correct ? question.marks : 0,
      };
    });
    saveExamSession({
      mode,
      subjectId,
      grade,
      topic: mode === "topic" ? topic : undefined,
      timed,
      questionIds: questions.map((x) => x.id),
      answers: payload,
      durationSec,
    });
    setSaved(true);
  }

  useEffect(() => {
    if (finished && !saved && questions.length > 0) {
      saveAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (!ready) {
    return <div className="py-20 text-center text-muted">Loading session…</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-white">No questions in bank</h1>
        <p className="text-sm text-muted">
          Try another subject, grade, or topic — expand coverage from Exam OS.
        </p>
        <Link href="/exams">
          <Button>Back to Exam OS</Button>
        </Link>
      </div>
    );
  }

  const answeredCount = questions.filter((x) => answers[x.id]?.revealed).length;
  const correctCount = questions.filter((x) => answers[x.id]?.correct).length;
  const marksEarned = questions.reduce(
    (s, x) => s + (answers[x.id]?.correct ? x.marks : 0),
    0
  );
  const marksTotal = questions.reduce((s, x) => s + x.marks, 0);

  if (finished) {
    return (
      <>
        <AppHeader
          title="Session"
          highlight="review"
          subtitle={`${getSubject(subjectId)?.name} · Grade ${grade} · ${mode}`}
          showGreeting={false}
        />
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted">Score</p>
              <p className="text-3xl font-bold text-white">
                {correctCount}/{questions.length}
                <span className="ml-2 text-lg text-muted">
                  ({Math.round((correctCount / questions.length) * 100)}%)
                </span>
              </p>
              <p className="mt-1 text-sm text-muted">
                Marks {marksEarned}/{marksTotal}
                {saved ? " · saved to readiness & activity" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/exams">
                <Button variant="secondary">Exam OS</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {questions.map((question, i) => {
            const a = answers[question.id];
            const ok = a?.correct;
            const rv = resolveExamView(question, language);
            return (
              <Card
                key={question.id}
                className={
                  ok
                    ? "border-emerald-400/20"
                    : "border-rose-400/20"
                }
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge>Q{i + 1}</Badge>
                  <Badge variant={ok ? "success" : "danger"}>
                    {ok ? `+${question.marks}` : `0/${question.marks}`}
                  </Badge>
                  <span className="text-xs text-muted">{question.topic}</span>
                </div>
                <p className="text-sm text-white" dir={rv.dir}>
                  {rv.prompt}
                </p>
                {rv.arabicHelper && (
                  <p className="mt-1 text-xs text-white/60" dir="rtl">
                    {rv.arabicHelper}
                  </p>
                )}
                {question.type === "mcq" && rv.choices && (
                  <p className="mt-2 text-xs text-muted" dir={rv.dir}>
                    Your answer:{" "}
                    {a?.value !== "" && a?.value != null
                      ? rv.choices[Number(a.value)] ?? a.value
                      : "—"}
                    {" · "}
                    Correct: {rv.choices[Number(question.correctAnswer)]}
                  </p>
                )}
                {question.type !== "mcq" && (
                  <p className="mt-2 text-xs text-muted">
                    Your answer: {a?.value || "—"}
                    {" · "}
                    Model: {question.correctAnswer.split("|")[0]}
                  </p>
                )}
                <p className="mt-3 text-sm text-white/75" dir={rv.dir}>
                  <span className="font-medium text-white">Explanation: </span>
                  {rv.explanation}
                </p>
                {question.rubricNotes && (
                  <p className="mt-1 text-xs text-muted">
                    Rubric: {question.rubricNotes}
                  </p>
                )}
                <Link
                  href={lessonHref(question.subjectId, question.topic)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Open lesson for {question.topic}
                </Link>
              </Card>
            );
          })}
        </div>
      </>
    );
  }

  const state = answers[q.id];
  const mins = remaining != null ? Math.floor(remaining / 60) : 0;
  const secs = remaining != null ? remaining % 60 : 0;

  return (
    <>
      <AppHeader
        title={mode === "mock" ? "Mock" : mode === "mixed" ? "Mixed" : "Drill"}
        highlight={`Grade ${grade}`}
        subtitle={`${getSubject(subjectId)?.name}${topic ? ` · ${topic}` : ""}`}
        showGreeting={false}
        action={
          timed && remaining != null ? (
            <Badge variant={remaining < 60 ? "danger" : "warning"}>
              <Clock className="mr-1 h-3 w-3" />
              {mins}:{secs.toString().padStart(2, "0")}
            </Badge>
          ) : undefined
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <ProgressBar
          value={(answeredCount / questions.length) * 100}
          className="flex-1"
        />
        <span className="text-xs text-muted">
          {idx + 1}/{questions.length}
        </span>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge>{q.type.toUpperCase()}</Badge>
          <Badge variant="default">{q.difficulty}</Badge>
          <Badge variant="default">{q.marks} marks</Badge>
          <span className="text-xs text-muted">{q.topic}</span>
          {view?.usedFallback && language === "ar" && (
            <Badge variant="warning">EN fallback</Badge>
          )}
        </div>
        <p
          className="text-base font-medium leading-relaxed text-white"
          dir={view?.dir || "ltr"}
        >
          {view?.prompt}
        </p>
        {view?.arabicHelper && (
          <p className="text-sm leading-relaxed text-white/65" dir="rtl">
            {view.arabicHelper}
          </p>
        )}

        {q.type === "mcq" && view?.choices && (
          <div className="grid gap-2 sm:grid-cols-2" dir={view.dir}>
            {view.choices.map((choice, ci) => {
              const selected = state?.value === String(ci);
              let style = "border-white/10 hover:bg-white/5";
              if (selected && !state?.revealed) {
                style = "border-indigo-400/50 bg-indigo-500/15";
              }
              if (state?.revealed) {
                if (String(ci) === q.correctAnswer) {
                  style = "border-emerald-400/40 bg-emerald-500/15";
                } else if (selected) {
                  style = "border-rose-400/40 bg-rose-500/10";
                }
              }
              return (
                <button
                  key={`${q.id}-${ci}`}
                  type="button"
                  disabled={state?.revealed}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: {
                        value: String(ci),
                        revealed: false,
                        correct: null,
                      },
                    }))
                  }
                  className={`rounded-xl border px-3 py-3 text-left text-sm text-white/90 ${style}`}
                >
                  <span className="mr-2 text-xs text-muted">
                    {String.fromCharCode(65 + ci)}.
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {(q.type === "short" || q.type === "structured") && (
          <div className="space-y-3">
            <textarea
              value={state?.value || ""}
              disabled={state?.revealed && q.type === "short"}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [q.id]: {
                    value: e.target.value,
                    selfMark: prev[q.id]?.selfMark,
                    revealed: false,
                    correct: null,
                  },
                }))
              }
              rows={q.type === "structured" ? 4 : 2}
              placeholder="Write your working / answer…"
              dir={view?.dir || "ltr"}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-indigo-500/40 focus:outline-none"
            />
            {q.type === "structured" && state?.revealed && (
              <div className="flex flex-wrap gap-2">
                <p className="w-full text-xs text-muted">
                  Self-mark against the model answer:
                </p>
                <Button
                  size="sm"
                  variant={state.selfMark ? "primary" : "secondary"}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: {
                        ...prev[q.id],
                        value: prev[q.id]?.value || "",
                        selfMark: true,
                        revealed: true,
                        correct: true,
                      },
                    }))
                  }
                >
                  Award marks
                </Button>
                <Button
                  size="sm"
                  variant={state.selfMark === false ? "primary" : "secondary"}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: {
                        ...prev[q.id],
                        value: prev[q.id]?.value || "",
                        selfMark: false,
                        revealed: true,
                        correct: false,
                      },
                    }))
                  }
                >
                  No marks
                </Button>
              </div>
            )}
          </div>
        )}

        {state?.revealed && view && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              state.correct
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                : "border-amber-400/25 bg-amber-500/10 text-amber-100"
            }`}
          >
            <div className="mb-1 flex items-center gap-2 font-medium">
              {state.correct ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : null}
              {state.correct
                ? `Correct · ${q.marks} marks`
                : q.type === "structured"
                  ? "Review model answer"
                  : "Not quite — study the mark scheme"}
            </div>
            <p className="text-white/80" dir={view.dir}>
              {view.explanation}
            </p>
            {q.rubricNotes && (
              <p className="mt-1 text-xs opacity-80">Rubric: {q.rubricNotes}</p>
            )}
            <Link
              href={lessonHref(q.subjectId, q.topic)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-300 hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Revise lesson: {q.topic}
            </Link>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="secondary"
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
            Prev
          </Button>
          {!state?.revealed ? (
            <Button
              onClick={revealCurrent}
              disabled={
                q.type === "mcq"
                  ? state?.value == null || state.value === ""
                  : !(state?.value || "").trim()
              }
            >
              Check answer
            </Button>
          ) : idx < questions.length - 1 ? (
            <Button onClick={() => setIdx((i) => i + 1)}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish}>Finish & review</Button>
          )}
          <Button variant="ghost" onClick={finish}>
            End early
          </Button>
        </div>
      </Card>
    </>
  );
}

export default function ExamSessionPage() {
  return (
    <Suspense
      fallback={<div className="py-20 text-center text-muted">Loading…</div>}
    >
      <ExamSessionInner />
    </Suspense>
  );
}
