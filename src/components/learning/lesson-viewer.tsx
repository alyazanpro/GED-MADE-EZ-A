"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type TopicLesson,
  isFullyBilingual,
  resolveLessonView,
  youtubeSearchUrl,
  youtubeThumbUrl,
  youtubeWatchUrl,
} from "@/data/lessons";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { YoutubeEmbed } from "@/components/learning/youtube-embed";
import { LanguageToggle } from "@/components/learning/language-toggle";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  Languages,
  Lightbulb,
  ListChecks,
  PlayCircle,
  Sparkles,
  Target,
  ClipboardCheck,
} from "lucide-react";
import { examDrillHref, countExamQuestions, mapTopicToCurriculum } from "@/data/exam-bank";
import { getSubject, type GradeLevel } from "@/data/curriculum";
import { useUserData } from "@/lib/use-user-data";

function inferGrade(subjectId: string, topic: string): GradeLevel {
  const subject = getSubject(subjectId);
  if (!subject) return 9;
  const mapped = mapTopicToCurriculum(subjectId, topic);
  const look = mapped || topic;
  for (const g of [9, 10, 11, 12] as GradeLevel[]) {
    if (subject.topicsByGrade[g]?.includes(look)) return g;
  }
  return subject.grades[0] || 9;
}

type Neighbor = { topic: string; href: string } | null;

type Props = {
  lesson: TopicLesson;
  subjectName: string;
  subjectId: string;
  mastery: number;
  completed: boolean;
  prevTopic: Neighbor;
  nextTopic: Neighbor;
  onCompleteLesson: (result: {
    quizPercent: number;
    watchedCount: number;
  }) => void;
};

function StepPill({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        done
          ? "bg-emerald-500/15 text-emerald-300"
          : active
            ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40"
            : "bg-white/5 text-muted"
      }`}
    >
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]">
          {n}
        </span>
      )}
      {label}
    </div>
  );
}

export function LessonViewer({
  lesson,
  subjectName,
  subjectId,
  mastery,
  completed,
  prevTopic,
  nextTopic,
  onCompleteLesson,
}: Props) {
  const { data, updateLearningLanguage } = useUserData();
  const language = data.learningLanguage ?? "mixed";
  const view = useMemo(
    () => resolveLessonView(lesson, language),
    [lesson, language]
  );

  const [activeVideo, setActiveVideo] = useState(0);
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  const watchedCount = useMemo(
    () => Object.values(watched).filter(Boolean).length,
    [watched]
  );

  const examGrade = inferGrade(subjectId, lesson.topic);
  const mappedTopic =
    mapTopicToCurriculum(subjectId, lesson.topic, examGrade) || lesson.topic;
  const examCount = countExamQuestions({
    subjectId,
    grade: examGrade,
    topic: mappedTopic,
  });
  const examHref = examDrillHref({
    subjectId,
    grade: examGrade,
    topic: mappedTopic,
    mode: "topic",
    count: 5,
  });

  const answeredCount = useMemo(
    () =>
      view.practice.filter((q) => typeof answers[q.id] === "number").length,
    [answers, view.practice]
  );

  const correctCount = useMemo(() => {
    if (!submitted) return 0;
    return view.practice.filter((q) => answers[q.id] === q.correctIndex)
      .length;
  }, [answers, view.practice, submitted]);

  const quizPercent = submitted
    ? Math.round((correctCount / view.practice.length) * 100)
    : 0;

  const canSubmit =
    answeredCount === view.practice.length && watchedCount >= 1;

  const estMinutes = Math.max(
    12,
    lesson.videos.length * 8 + lesson.practice.length * 2
  );

  const stepWatchDone = watchedCount >= 1;
  const stepQuizDone = submitted;
  const stepSaveDone = saved;
  const activeStep = !stepWatchDone ? 1 : !stepQuizDone ? 2 : 3;

  const markWatched = (id: string) => {
    setWatched((prev) => ({ ...prev, [id]: true }));
    setSaved(false);
  };

  const submitQuiz = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    setSaved(false);
  };

  const saveProgress = () => {
    if (!submitted || watchedCount < 1) return;
    onCompleteLesson({ quizPercent, watchedCount });
    setSaved(true);
  };

  const video = lesson.videos[activeVideo] ?? lesson.videos[0];
  const searchUrl = youtubeSearchUrl(
    `${subjectName} ${lesson.topic} explained OR tutorial OR شرح`
  );

  const scrollToQuiz = () => {
    document.getElementById("lesson-quiz")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const bilingual = isFullyBilingual(lesson);
  const whyLabel = language === "ar" ? "لماذا: " : "Why: ";
  const goalsLabel =
    language === "ar" ? "أهداف التعلم" : "Learning goals";
  const keyPointsLabel =
    language === "ar" ? "نقاط أساسية" : "Key points";
  const quizTitle =
    language === "ar" ? "تحقق من فهمك" : "Check your understanding";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/subjects#${subjectId}`}
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === "ar" ? "العودة للمواد" : "Back to subjects"}
          </Link>
          <Badge variant="info">{subjectName}</Badge>
          {completed ? (
            <Badge variant="success">
              {language === "ar" ? "متقن" : "Mastered"}
            </Badge>
          ) : (
            <Badge>
              {mastery}% {language === "ar" ? "إتقان" : "mastery"}
            </Badge>
          )}
          {bilingual && (
            <Badge variant="info" className="!text-[10px]">
              EN / ع
            </Badge>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Clock3 className="h-3.5 w-3.5" />~{estMinutes} min
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle
            compact
            value={language}
            onChange={updateLearningLanguage}
            className="w-[140px]"
          />
          {prevTopic && (
            <Link href={prevTopic.href}>
              <Button size="sm" variant="ghost">
                <ArrowLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
            </Link>
          )}
          {nextTopic && (
            <Link href={nextTopic.href}>
              <Button size="sm" variant="secondary">
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div dir={view.dir === "rtl" ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {view.topicTitle}
        </h1>
        {view.topicSubtitle && (
          <p
            className="mt-1 text-sm text-muted"
            dir={view.dir === "rtl" ? "ltr" : "rtl"}
          >
            {view.topicSubtitle}
          </p>
        )}
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          {view.summary}
        </p>
      </div>

      {view.missingNotice && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <Languages className="mt-0.5 h-4 w-4 shrink-0" />
          <span dir="auto">{view.missingNotice}</span>
        </div>
      )}

      {view.showGlossary && lesson.glossary && lesson.glossary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-[10px] font-medium uppercase tracking-wider text-muted">
            Glossary
          </span>
          {lesson.glossary.map((g) => (
            <span
              key={g.en}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100"
            >
              <span className="font-medium text-white">{g.en}</span>
              <span className="text-cyan-400/70">↔</span>
              <span dir="rtl">{g.ar}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
        <StepPill n={1} label="Watch" active={activeStep === 1} done={stepWatchDone} />
        <StepPill n={2} label="Quiz" active={activeStep === 2} done={stepQuizDone} />
        <StepPill n={3} label="Save" active={activeStep === 3} done={stepSaveDone} />
        <p className="ml-auto self-center text-[11px] text-muted">
          {activeStep === 1 && "Mark at least one video watched"}
          {activeStep === 2 && "Answer every question, then submit"}
          {activeStep === 3 && !saved && "Save to raise your mastery"}
          {saved && "Nice work — pick the next topic when ready"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-4">
          {video && (
            <YoutubeEmbed
              youtubeId={video.youtubeId}
              title={video.title}
              channel={video.channel}
              durationLabel={video.durationLabel}
            />
          )}

          <div className="flex flex-wrap gap-2">
            {video && (
              <Button
                size="sm"
                variant={watched[video.youtubeId] ? "secondary" : "primary"}
                onClick={() => markWatched(video.youtubeId)}
              >
                {watched[video.youtubeId] ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Watched
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4" /> Mark as watched
                  </>
                )}
              </Button>
            )}
            {stepWatchDone && !submitted && (
              <Button size="sm" variant="outline" onClick={scrollToQuiz}>
                Continue to quiz
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {lesson.videos.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Lesson playlist · {lesson.videos.length} videos
                </p>
                <span className="text-[11px] text-muted">
                  {watchedCount}/{lesson.videos.length} watched
                </span>
              </div>
              <div className="grid gap-2">
                {lesson.videos.map((v, idx) => {
                  const isActive = idx === activeVideo;
                  const isWatched = !!watched[v.youtubeId];
                  return (
                    <div
                      key={v.youtubeId + idx}
                      className={`flex items-stretch gap-3 overflow-hidden rounded-xl border transition ${
                        isActive
                          ? "border-indigo-400/40 bg-indigo-500/15"
                          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveVideo(idx)}
                        className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left"
                      >
                        <div
                          className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-black/50"
                          style={{
                            backgroundImage: `url(${youtubeThumbUrl(v.youtubeId)})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                            <PlayCircle className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white">
                            {idx + 1}. {v.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {v.channel}
                            {v.durationLabel ? ` · ${v.durationLabel}` : ""}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => markWatched(v.youtubeId)}
                        className="shrink-0 self-center px-3 text-xs text-cyan-300 hover:text-cyan-200"
                      >
                        {isWatched ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Done
                          </span>
                        ) : (
                          "Mark"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-300" />
              <h2 className="text-sm font-semibold text-white">{goalsLabel}</h2>
            </div>
            <ul className="space-y-2" dir={view.dir === "rtl" ? "rtl" : "ltr"}>
              {view.objectives.map((o) => (
                <li key={o} className="flex gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  <span className="text-white/80">{o}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-300" />
              <h2 className="text-sm font-semibold text-white">
                {keyPointsLabel}
              </h2>
            </div>
            <ul className="space-y-2.5" dir={view.dir === "rtl" ? "rtl" : "ltr"}>
              {view.keyPoints.map((p) => (
                <li
                  key={p}
                  className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm leading-relaxed text-white/85"
                >
                  {p}
                </li>
              ))}
            </ul>
          </Card>

          {view.arabicBrief && (
            <Card className="border-emerald-400/20 bg-emerald-500/[0.06]">
              <div className="mb-3 flex items-center gap-2">
                <Languages className="h-4 w-4 text-emerald-300" />
                <h2 className="text-sm font-semibold text-white" dir="rtl">
                  شرح مختصر
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-white/85" dir="rtl">
                {view.arabicBrief.summary}
              </p>
              <ul className="mt-3 space-y-1.5" dir="rtl">
                {view.arabicBrief.keyPoints.slice(0, 4).map((p) => (
                  <li key={p} className="text-xs leading-relaxed text-emerald-100/90">
                    • {p}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {view.englishGloss && (
            <Card className="border-sky-400/20 bg-sky-500/[0.06]">
              <div className="mb-2 flex items-center gap-2">
                <Languages className="h-4 w-4 text-sky-300" />
                <h2 className="text-sm font-semibold text-white">
                  English gloss
                </h2>
              </div>
              <p className="text-sm text-white/80">{view.englishGloss.summary}</p>
              <ul className="mt-2 space-y-1">
                {view.englishGloss.keyPoints.map((p) => (
                  <li key={p} className="text-xs text-sky-100/80">
                    • {p}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">Your progress</h2>
              <span className="text-xs text-muted">{mastery}%</span>
            </div>
            <ProgressBar value={mastery} color="indigo" />
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge variant={watchedCount >= 1 ? "success" : "default"}>
                {watchedCount}/{lesson.videos.length} videos
              </Badge>
              <Badge variant={submitted ? "success" : "default"}>
                Quiz {submitted ? `${quizPercent}%` : "pending"}
              </Badge>
              <Badge variant={saved ? "success" : "default"}>
                {saved ? "Saved" : "Not saved"}
              </Badge>
            </div>
          </Card>

          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-500/15"
          >
            <span>More YouTube explanations for this topic</span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>

          {lesson.extraLinks
            ?.filter((l) => !l.url.includes("search_query") || l.label.includes("Khan"))
            .slice(0, 2)
            .map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80 transition hover:bg-white/[0.05]"
              >
                <span>{link.label}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted" />
              </a>
            ))}

          <Link
            href={`/tutor?subject=${encodeURIComponent(subjectId)}&q=${encodeURIComponent(
              language === "ar"
                ? `اشرح ${lesson.topic} ببساطة مع مثال من كتاب الوزارة`
                : `Explain ${lesson.topic} simply with a worked example from my MoE textbook`
            )}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100 transition hover:bg-violet-500/15"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {language === "ar"
                ? "اسأل المدرّس الذكي عن هذا الموضوع"
                : "Ask AI tutor about this topic"}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </div>

      <Card id="lesson-quiz" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">{quizTitle}</h2>
          </div>
          <Badge>
            {answeredCount}/{view.practice.length} answered
          </Badge>
        </div>
        <p className="text-sm text-muted">
          {language === "ar"
            ? "شاهد أولاً ثم أجب. الإجابات الخاطئة تظهر الشرح قبل حفظ الإتقان."
            : "Watch first, then answer. Wrong answers show explanations so you can fix gaps before saving mastery."}
        </p>

        {!stepWatchDone && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Mark at least one video as watched before submitting the quiz.
          </div>
        )}

        <div className="space-y-4">
          {view.practice.map((q, qi) => {
            const chosen = answers[q.id];
            const isCorrect = submitted && chosen === q.correctIndex;
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-4 ${
                  submitted
                    ? isCorrect
                      ? "border-emerald-400/25 bg-emerald-500/[0.06]"
                      : "border-rose-400/20 bg-rose-500/[0.05]"
                    : "border-white/8 bg-white/[0.02]"
                }`}
                dir={language === "ar" ? "rtl" : "ltr"}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-white">
                    {qi + 1}. {q.prompt}
                  </p>
                  {submitted && (
                    <Badge variant={isCorrect ? "success" : "danger"}>
                      {isCorrect
                        ? language === "ar"
                          ? "صحيح"
                          : "Correct"
                        : language === "ar"
                          ? "راجع"
                          : "Review"}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.choices.map((choice, ci) => {
                    const selected = chosen === ci;
                    let style =
                      "border-white/10 bg-transparent hover:bg-white/5";
                    if (selected && !submitted) {
                      style = "border-indigo-400/50 bg-indigo-500/15";
                    }
                    if (submitted) {
                      if (ci === q.correctIndex) {
                        style = "border-emerald-400/40 bg-emerald-500/15";
                      } else if (selected) {
                        style = "border-rose-400/40 bg-rose-500/10";
                      }
                    }
                    return (
                      <button
                        key={`${q.id}-${ci}`}
                        type="button"
                        disabled={submitted}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: ci }))
                        }
                        className={`rounded-lg border px-3 py-2.5 text-left text-sm text-white/90 transition ${style}`}
                      >
                        <span className="mr-2 text-xs text-muted">
                          {String.fromCharCode(65 + ci)}.
                        </span>
                        {choice}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="mt-3 text-xs leading-relaxed text-white/70">
                    <span className="font-medium text-white/90">{whyLabel}</span>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {submitted && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              quizPercent >= 70
                ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                : "border-amber-400/25 bg-amber-500/10 text-amber-100"
            }`}
          >
            Score: <strong>{correctCount}/{view.practice.length}</strong> (
            {quizPercent}%).{" "}
            {quizPercent >= 70
              ? "Solid — save progress to raise mastery."
              : "Re-watch the key points, retry, then save."}
          </div>
        )}

        {saved && (
          <div className="rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-4">
            <p className="font-medium text-white">Lesson progress saved</p>
            <p className="mt-1 text-sm text-muted">
              Mastery updated from this video + quiz session.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {examCount > 0 && (
                <Link href={examHref}>
                  <Button size="sm">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Try 5 exam-style questions on this topic
                  </Button>
                </Link>
              )}
              {nextTopic ? (
                <Link href={nextTopic.href}>
                  <Button size="sm" variant={examCount > 0 ? "secondary" : "primary"}>
                    Next: {nextTopic.topic}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/subjects">
                  <Button size="sm" variant="secondary">
                    Back to subjects
                  </Button>
                </Link>
              )}
              <Link href="/tutor">
                <Button size="sm" variant="secondary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask tutor
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {!submitted ? (
            <Button onClick={submitQuiz} disabled={!canSubmit}>
              Submit quiz
            </Button>
          ) : !saved ? (
            <Button onClick={saveProgress}>Save lesson progress</Button>
          ) : null}
          {submitted && (
            <Button
              variant="secondary"
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
                setSaved(false);
              }}
            >
              Retry quiz
            </Button>
          )}
          {video && (
            <a
              href={youtubeWatchUrl(video.youtubeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-white"
            >
              Open video on YouTube
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}
