"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Button, Card } from "@/components/ui";
import {
  SUBJECT_CATALOG,
  GRADE_META,
  getSubject,
  type GradeLevel,
} from "@/data/curriculum";
import { useUserData } from "@/lib/use-user-data";
import { useClassroom } from "@/lib/use-classroom";
import {
  buildDailyExamPlan,
  buildRecommendations,
  daysUntilExam,
} from "@/lib/user-data";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Plus,
  Trash2,
  ClipboardCheck,
  BookOpen,
  School,
} from "lucide-react";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function PlannerPage() {
  const { data, ready, createTask, completeTask, deleteTask, updateExamPlanner } =
    useUserData();
  const { assignments, completeAssignment } = useClassroom();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(SUBJECT_CATALOG[0].id);
  const [durationMin, setDurationMin] = useState(30);
  const [dueDate, setDueDate] = useState(todayKey());
  const [examDate, setExamDate] = useState("");
  const [focusGrade, setFocusGrade] = useState<GradeLevel>(9);

  useEffect(() => {
    if (!ready) return;
    setExamDate(data.examTargetDate || "");
    setFocusGrade(data.examFocusGrade || 9);
  }, [ready, data.examTargetDate, data.examFocusGrade]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      const dayIndex = (d.getDay() + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayIndex + i);
      const key = monday.toISOString().slice(0, 10);
      const dayTasks = data.tasks.filter((t) => t.dueDate === key);
      const completed = dayTasks.filter((t) => t.completed).length;
      const hours =
        Math.round(
          (dayTasks.reduce((sum, t) => sum + (t.completed ? t.durationMin : 0), 0) / 60) *
            10
        ) / 10;
      return {
        key,
        day: monday.toLocaleDateString("en-US", { weekday: "short" }),
        tasks: dayTasks.length,
        completed,
        hours,
        isToday: key === todayKey(),
      };
    });
  }, [data.tasks]);

  const todayTasks = data.tasks
    .filter((t) => t.dueDate === todayKey())
    .sort((a, b) => Number(a.completed) - Number(b.completed));

  const tips = buildRecommendations(data).slice(0, 3);
  const dailyPlan = buildDailyExamPlan(data);
  const daysLeft = daysUntilExam(data);
  const openCount = data.tasks.filter((t) => !t.completed && t.dueDate === todayKey()).length;
  const estMin = todayTasks
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + t.durationMin, 0);

  function onAdd() {
    if (!title.trim()) return;
    createTask({
      title: title.trim(),
      subjectId,
      durationMin,
      dueDate,
    });
    setTitle("");
  }

  function saveExamSettings() {
    updateExamPlanner({
      examTargetDate: examDate || null,
      examFocusGrade: focusGrade,
    });
  }

  function addSuggestedTasks() {
    createTask({
      title: dailyPlan.revision.title,
      subjectId: dailyPlan.revision.subjectId,
      durationMin: dailyPlan.revision.durationMin,
      dueDate: todayKey(),
    });
    createTask({
      title: dailyPlan.examDrill.title,
      subjectId: dailyPlan.examDrill.subjectId,
      durationMin: 25,
      dueDate: todayKey(),
    });
  }

  if (!ready) {
    return <div className="py-20 text-center text-muted">Loading planner…</div>;
  }

  return (
    <>
      <AppHeader
        title="Revision"
        highlight="planner"
        subtitle="Set your MoE exam date — daily plan = 1 lesson revision + 10 weak-topic exam Qs."
        showGreeting={false}
      />

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold text-white">Exam countdown</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs text-muted">
            Target exam date
            <input
              type="date"
              value={examDate || data.examTargetDate || ""}
              onChange={(e) => setExamDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
            />
          </label>
          <label className="text-xs text-muted">
            Focus grade
            <select
              value={focusGrade}
              onChange={(e) => setFocusGrade(Number(e.target.value) as GradeLevel)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
            >
              {([9, 10, 11, 12] as GradeLevel[]).map((g) => (
                <option key={g} value={g} className="bg-[#121826]">
                  {GRADE_META[g].title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button onClick={saveExamSettings}>Save target</Button>
            {daysLeft != null && (
              <Badge variant={daysLeft <= 14 ? "danger" : "warning"}>
                {daysLeft < 0 ? "Past target" : `${daysLeft} days left`}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <Card className="mb-6 border-indigo-500/20 bg-indigo-500/5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-white">Suggested today</h3>
          <Button size="sm" variant="secondary" onClick={addSuggestedTasks}>
            Add both to today
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={dailyPlan.revision.lessonHref}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-indigo-400/30"
          >
            <BookOpen className="mb-2 h-4 w-4 text-indigo-300" />
            <p className="text-sm font-medium text-white">{dailyPlan.revision.title}</p>
            <p className="mt-1 text-xs text-muted">
              {dailyPlan.revision.subjectName} · ~{dailyPlan.revision.durationMin} min lesson
            </p>
          </Link>
          <Link
            href={dailyPlan.examDrill.href}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/30"
          >
            <ClipboardCheck className="mb-2 h-4 w-4 text-emerald-300" />
            <p className="text-sm font-medium text-white">{dailyPlan.examDrill.title}</p>
            <p className="mt-1 text-xs text-muted">
              Grade {dailyPlan.grade} · mixed paper · updates readiness
            </p>
          </Link>
        </div>
      </Card>

      {assignments.length > 0 && (
        <Card className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <School className="h-4 w-4 text-cyan-400" />
            Class assignments
          </h3>
          <div className="space-y-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
              >
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm ${a.completed ? "text-muted line-through" : "text-white"}`}
                  >
                    {a.topic}
                  </p>
                  <p className="text-[10px] text-muted">
                    {a.className} · due {a.dueDate} ·{" "}
                    {a.type === "lesson" ? "Lesson" : "Exam drill"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!a.completed && (
                    <>
                      <Link href={a.href}>
                        <Button size="sm" variant="secondary">
                          Open
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void completeAssignment(a.id)}
                      >
                        Mark done
                      </Button>
                    </>
                  )}
                  {a.completed && <Badge variant="success">Done</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <Calendar className="h-5 w-5 text-indigo-400" />
        <div>
          <p className="text-sm font-medium text-white">{today}</p>
          <p className="text-xs text-muted">
            {openCount} open task{openCount === 1 ? "" : "s"} · {estMin} min remaining
          </p>
        </div>
        <Badge variant={openCount === 0 ? "success" : "warning"} className="ml-auto">
          {openCount === 0 ? "Clear today" : "In progress"}
        </Badge>
      </div>

      <Card className="mb-8">
        <h3 className="mb-4 font-semibold text-white">Add study task</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Revise Newton's laws"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-indigo-500/50 focus:outline-none md:col-span-2"
          />
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none"
          >
            {SUBJECT_CATALOG.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#121826]">
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              min={5}
              max={240}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value) || 30)}
              className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none"
            />
            <Button onClick={onAdd} disabled={!title.trim()}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-7">
        {week.map((day) => (
          <Card
            key={day.key}
            className={`p-3 text-center ${day.isToday ? "ring-1 ring-indigo-500/40" : ""}`}
          >
            <p className="text-xs font-medium text-muted">{day.day}</p>
            <p className="mt-1 text-lg font-bold text-white">
              {day.completed}/{day.tasks}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{
                  width: `${day.tasks ? (day.completed / day.tasks) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[10px] text-muted">{day.hours}h done</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-white">Today&apos;s schedule</h3>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted">No tasks due today. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => {
                const subject = getSubject(task.subjectId);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <button onClick={() => completeTask(task.id)} title="Toggle complete">
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          task.completed ? "text-muted line-through" : "text-white"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        {task.durationMin} min · {subject?.name || "Subject"}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {data.tasks.filter((t) => t.dueDate !== todayKey()).length > 0 && (
            <div className="mt-6 border-t border-white/8 pt-4">
              <h4 className="mb-3 text-sm font-semibold text-white">Other upcoming</h4>
              <div className="space-y-2">
                {data.tasks
                  .filter((t) => !t.completed && t.dueDate !== todayKey())
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .slice(0, 6)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-sm"
                    >
                      <span className="text-white/90">{task.title}</span>
                      <span className="text-xs text-muted">{task.dueDate}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-white">Study tips for you</h3>
          <div className="space-y-4">
            {tips.length === 0 ? (
              <p className="text-sm text-muted">
                Keep studying topics — personalized tips appear from your weak areas.
              </p>
            ) : (
              tips.map((item) => (
                <div
                  key={`${item.subjectId}-${item.title}`}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <Badge variant={item.priority === "high" ? "danger" : "default"}>
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/80">
                    {item.title} ({item.subject}) — {item.reason}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
