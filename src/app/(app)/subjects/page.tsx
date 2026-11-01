"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import {
  SUBJECT_CATALOG,
  GRADE_META,
  type GradeLevel,
  getTopicsForGrade,
  formatGrades,
} from "@/data/curriculum";
import { getLesson, getLessonPath, hasCuratedLesson, estimateLessonMinutes, isFullyBilingual } from "@/data/lessons";
import { useUserData } from "@/lib/use-user-data";
import { getTopicProgress } from "@/lib/user-data";
import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Clock3, PlayCircle } from "lucide-react";

type GradeFilter = "all" | GradeLevel;

const GRADE_FILTERS: { id: GradeFilter; label: string }[] = [
  { id: "all", label: "All grades" },
  { id: 9, label: "Grade 9" },
  { id: 10, label: "Grade 10" },
  { id: 11, label: "Grade 11" },
  { id: 12, label: "Grade 12" },
];

export default function SubjectsPage() {
  const { data, ready } = useUserData();
  const [openId, setOpenId] = useState<string | null>("math");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const lang = data.learningLanguage ?? "mixed";
  const showArSubtitle = lang === "ar" || lang === "mixed";

  const rows = useMemo(() => {
    return SUBJECT_CATALOG.map((subject) => {
      const topics =
        gradeFilter === "all"
          ? subject.topics
          : getTopicsForGrade(subject, gradeFilter);

      const progresses = topics.map((t) => getTopicProgress(data, subject.id, t));
      const totalTopics = topics.length;
      const completedTopics = progresses.filter((p) => p.completed).length;
      const weakTopics = progresses.filter(
        (p) => !p.completed && p.mastery > 0 && p.mastery < 50
      ).length;
      const progress =
        totalTopics === 0
          ? 0
          : Math.round(
              progresses.reduce((sum, p) => sum + p.mastery, 0) / totalTopics
            );

      return {
        ...subject,
        topics,
        totalTopics,
        completedTopics,
        weakTopics,
        progress,
      };
    }).filter((s) => s.totalTopics > 0);
  }, [data, gradeFilter]);

  if (!ready) {
    return <div className="py-20 text-center text-muted">Loading subjects…</div>;
  }

  const gradeHint =
    gradeFilter === "all"
      ? "Each topic opens a real lesson — Start lesson for videos, notes, and a quiz (not a vague “study topic” link)."
      : GRADE_META[gradeFilter].focus;

  return (
    <>
      <AppHeader
        title="Your"
        highlight="subjects"
        subtitle={gradeHint}
        showGreeting={false}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {GRADE_FILTERS.map((g) => (
          <button
            key={String(g.id)}
            type="button"
            onClick={() => setGradeFilter(g.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              gradeFilter === g.id
                ? "bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/40"
                : "bg-white/5 text-muted hover:bg-white/10 hover:text-white"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {gradeFilter !== "all" && (
        <p className="mb-6 text-sm text-muted">
          Showing <span className="text-white">{GRADE_META[gradeFilter].title}</span>{" "}
          topics
          {GRADE_META[gradeFilter].stage === "basic"
            ? " (Basic Education)"
            : " (General Education Diploma)"}
          .
        </p>
      )}

      <div className="grid gap-6">
        {rows.map((subject) => {
          const open = openId === subject.id;
          return (
            <Card key={subject.id} id={subject.id} className="overflow-hidden">
              <button
                type="button"
                className="flex w-full items-start gap-5 text-left"
                onClick={() => setOpenId(open ? null : subject.id)}
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
                  <subject.icon className="h-8 w-8 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                          {subject.name}
                        </h3>
                        {subject.nameAr && (
                          <span className="text-sm text-muted" dir="rtl">
                            {subject.nameAr}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted">{subject.description}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatGrades(subject.grades)}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-muted" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted" />
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge>{subject.totalTopics} topics</Badge>
                    <Badge variant={subject.weakTopics > 0 ? "danger" : "success"}>
                      {subject.weakTopics} weak
                    </Badge>
                    <Badge variant="info">
                      {subject.completedTopics} mastered
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted">Progress</span>
                      <span className="font-semibold text-white">
                        {subject.progress}%
                      </span>
                    </div>
                    <ProgressBar value={subject.progress} color={subject.color} />
                  </div>
                </div>
              </button>

              {open && (
                <div className="mt-5 space-y-2 border-t border-white/8 pt-5">
                  {subject.topics.map((topic) => {
                    const progress = getTopicProgress(data, subject.id, topic);
                    const curated = hasCuratedLesson(subject.id, topic);
                    const lesson = getLesson(subject.id, topic);
                    const mins = estimateLessonMinutes(lesson);
                    const bilingual = curated && isFullyBilingual(lesson);
                    const topicAr = lesson.topicAr;
                    return (
                      <div
                        key={topic}
                        className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {progress.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-muted" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">
                                {lang === "ar" && topicAr ? topicAr : topic}
                              </p>
                              {showArSubtitle && topicAr && lang !== "ar" && (
                                <p className="text-xs text-muted" dir="rtl">
                                  {topicAr}
                                </p>
                              )}
                              {lang === "ar" && topicAr && (
                                <p className="text-xs text-muted">{topic}</p>
                              )}
                            </div>
                            {bilingual && (
                              <Badge variant="info" className="!text-[10px]">
                                EN / ع
                              </Badge>
                            )}
                            {curated && (
                              <Badge variant="info" className="!text-[10px]">
                                {lesson.videos.length} video
                                {lesson.videos.length === 1 ? "" : "s"}
                              </Badge>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted">
                              <Clock3 className="h-3 w-3" />~{mins} min
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <ProgressBar
                              value={progress.mastery}
                              color={
                                progress.mastery >= 80
                                  ? "emerald"
                                  : progress.mastery >= 50
                                    ? "indigo"
                                    : "rose"
                              }
                              className="max-w-xs flex-1"
                            />
                            <span className="text-xs text-muted">
                              {progress.mastery}%
                            </span>
                          </div>
                        </div>
                        <Link href={getLessonPath(subject.id, topic)}>
                          <Button
                            size="sm"
                            variant={progress.completed ? "secondary" : "primary"}
                          >
                            <PlayCircle className="h-4 w-4" />
                            {progress.completed ? "Revise lesson" : "Start lesson"}
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
