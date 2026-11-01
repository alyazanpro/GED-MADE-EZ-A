"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Card, ProgressBar, Button } from "@/components/ui";
import { SUBJECT_CATALOG } from "@/data/curriculum";
import { useUserData } from "@/lib/use-user-data";
import {
  buildWeakTopics,
  computeReadiness,
  getTopicProgress,
  masteryHistory,
  overallMastery,
  subjectProgress,
} from "@/lib/user-data";
import { TrendingUp, AlertTriangle, Target, ClipboardCheck } from "lucide-react";

export default function AnalyticsPage() {
  const { data, ready } = useUserData();

  const topicRows = useMemo(() => {
    return SUBJECT_CATALOG.flatMap((subject) =>
      subject.topics.map((topic) => {
        const p = getTopicProgress(data, subject.id, topic);
        return {
          topic,
          subject: subject.name,
          subjectId: subject.id,
          mastery: p.mastery,
          completed: p.completed,
        };
      })
    )
      .filter((t) => t.mastery > 0)
      .sort((a, b) => a.mastery - b.mastery);
  }, [data]);

  const chartTopics = topicRows.slice(0, 8);
  const history = masteryHistory(data);
  const mastery = overallMastery(data);
  const readiness = computeReadiness(data);
  const weak = buildWeakTopics(data);
  const atRisk = weak.length;
  const weeklyDelta =
    history.length >= 2
      ? history[history.length - 1].mastery - history[history.length - 2].mastery
      : 0;

  const heatmapRows = SUBJECT_CATALOG.slice(0, 4).map((subject) => {
    const progresses = subject.topics.map(
      (t) => getTopicProgress(data, subject.id, t).mastery
    );
    const avg = subjectProgress(data, subject.id).progress;
    const values = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const studied = data.studyDays.find((s) => s.date === key)?.minutes || 0;
      if (avg === 0) return studied > 0 ? 35 : 0;
      return Math.max(
        0,
        Math.min(
          100,
          Math.round(
            avg - (studied === 0 ? 15 : 0) + (progresses[i % progresses.length] || 0) * 0.1
          )
        )
      );
    });
    return { topic: subject.name, values };
  });

  function heatColor(value: number) {
    if (value <= 0) return "bg-white/5";
    if (value >= 80) return "bg-emerald-500/60";
    if (value >= 60) return "bg-emerald-500/30";
    if (value >= 40) return "bg-amber-500/30";
    return "bg-red-500/40";
  }

  if (!ready) {
    return <div className="py-20 text-center text-muted">Loading analytics…</div>;
  }

  return (
    <>
      <AppHeader
        title="Learning"
        highlight="analytics"
        subtitle="Mastery + exam practice feed a transparent readiness score — not sample numbers."
        showGreeting={false}
      />

      <Card className="mb-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Exam readiness</p>
            <p className="mt-1 text-3xl font-bold text-white">
              {readiness.score}
              <span className="text-lg text-muted">/10</span>
            </p>
            <p className="mt-1 max-w-lg text-[11px] text-muted">
              {readiness.formulaLabel}
            </p>
          </div>
          <Link href="/exams">
            <Button size="sm" variant="secondary">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Practice exams
            </Button>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Topic mastery", v: readiness.topicMastery },
            { label: "Exam accuracy (7d)", v: readiness.examAccuracy7d },
            { label: "Grade coverage", v: readiness.coverage },
            { label: "Recency", v: readiness.recency },
          ].map((x) => (
            <div
              key={x.label}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
            >
              <p className="text-[10px] text-muted">{x.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{x.v}%</p>
              <ProgressBar value={x.v} className="mt-2" />
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Predicted readiness",
            value: `${readiness.score}/10`,
            icon: TrendingUp,
            color: "text-emerald-400",
          },
          {
            label: "Topics at risk",
            value: String(atRisk),
            icon: AlertTriangle,
            color: "text-amber-400",
          },
          {
            label: "Week-over-week mastery",
            value: `${weeklyDelta >= 0 ? "+" : ""}${weeklyDelta}%`,
            icon: Target,
            color: "text-indigo-400",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {weak.length > 0 && (
        <Card className="mb-8">
          <h3 className="mb-3 font-semibold text-white">Weak topics (actionable)</h3>
          <div className="space-y-2">
            {weak.map((w) => (
              <div
                key={`${w.subjectId}-${w.topic}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-white">{w.topic}</p>
                  <p className="text-[11px] text-muted">
                    {w.subjectName} · mastery {w.mastery}%
                    {w.examAccuracy != null ? ` · exam ${w.examAccuracy}%` : ""}
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <Link href={w.lessonHref} className="text-indigo-400 hover:underline">
                    Lesson
                  </Link>
                  <Link href={w.drillHref} className="text-emerald-400 hover:underline">
                    Exam drill
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {mastery === 0 && data.examSessions.length === 0 ? (
        <Card className="mb-8 border-dashed text-center">
          <p className="text-sm text-white">No analytics yet</p>
          <p className="mt-1 text-xs text-muted">
            Study topics or run an Exam OS session to populate charts.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/subjects">
              <Button size="sm" variant="secondary">
                Start studying
              </Button>
            </Link>
            <Link href="/exams">
              <Button size="sm">Exam practice</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 font-semibold text-white">Lowest mastery topics</h3>
              {chartTopics.length === 0 ? (
                <p className="text-sm text-muted">Study a topic to see the breakdown.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartTopics} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="topic"
                        width={120}
                        tick={{ fill: "#8b95a8", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#121826",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Bar dataKey="mastery" radius={[0, 6, 6, 0]}>
                        {chartTopics.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.mastery >= 80
                                ? "#34d399"
                                : entry.mastery >= 60
                                  ? "#818cf8"
                                  : "#f87171"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-white">Mastery trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history}>
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "#8b95a8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#8b95a8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#121826",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="mastery" fill="#818cf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="mb-8">
            <h3 className="mb-2 font-semibold text-white">Study intensity heatmap</h3>
            <p className="mb-4 text-xs text-muted">
              Last 7 days × subject strength. Empty cells mean no activity yet.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="pb-3 text-left text-xs font-medium text-muted">Subject</th>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <th key={d} className="pb-3 text-center text-xs font-medium text-muted">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapRows.map((row) => (
                    <tr key={row.topic}>
                      <td className="py-2 pr-4 text-sm text-white">{row.topic}</td>
                      {row.values.map((value, i) => (
                        <td key={i} className="p-1">
                          <div
                            className={`mx-auto h-8 w-8 rounded-lg ${heatColor(value)}`}
                            title={`${value}%`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {topicRows.length > 0 && (
            <Card>
              <h3 className="mb-4 font-semibold text-white">Topics you&apos;ve studied</h3>
              <div className="space-y-4">
                {topicRows.map((topic) => (
                  <div
                    key={`${topic.subjectId}-${topic.topic}`}
                    className="flex items-center gap-4"
                  >
                    <div className="w-36 shrink-0">
                      <p className="text-sm font-medium text-white">{topic.topic}</p>
                      <p className="text-xs text-muted">{topic.subject}</p>
                    </div>
                    <ProgressBar
                      value={topic.mastery}
                      color={
                        topic.mastery >= 80
                          ? "emerald"
                          : topic.mastery >= 60
                            ? "indigo"
                            : "rose"
                      }
                      className="flex-1"
                    />
                    <span className="w-12 text-right text-sm font-semibold text-white">
                      {topic.mastery}%
                    </span>
                    <Badge variant={topic.completed ? "success" : "warning"}>
                      {topic.completed ? "Mastered" : "In progress"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
