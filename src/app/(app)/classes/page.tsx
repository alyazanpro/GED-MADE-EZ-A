"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, School, Users, ClipboardList } from "lucide-react";
import { AppHeader } from "@/components/layout/app-sidebar";
import { Badge, Button, Card } from "@/components/ui";
import { useClassroom } from "@/lib/use-classroom";
import { getSubject } from "@/data/curriculum";

export default function ClassesPage() {
  const {
    ready,
    error,
    myClasses,
    assignments,
    joinClass,
    completeAssignment,
    refresh,
  } = useClassroom();

  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  async function onJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinMsg(null);
    try {
      const res = await joinClass(joinCode.trim());
      setJoinMsg(
        res.alreadyJoined
          ? `Already in ${res.class.name}`
          : `Joined ${res.class.name}`
      );
      setJoinCode("");
    } catch (err) {
      setJoinMsg(err instanceof Error ? err.message : "Could not join class.");
    } finally {
      setJoining(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const open = assignments.filter((a) => !a.completed);
  const done = assignments.filter((a) => a.completed);

  return (
    <>
      <AppHeader
        title="Your"
        highlight="classes"
        subtitle="Join with a teacher code, open assignments, and sync academic progress."
        showGreeting={false}
        action={
          <Button size="sm" variant="secondary" onClick={() => void refresh()}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-red-500/20 bg-red-500/10 text-sm text-red-300">
          {error}
        </Card>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
            <Users className="h-4 w-4 text-indigo-400" />
            Join a class
          </h3>
          <p className="mb-4 text-xs text-muted">
            Ask your teacher for the 6-character join code. Progress syncs for
            class insights — tutor chat stays private.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Join code"
              maxLength={8}
              className="w-40 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm tracking-widest text-white outline-none focus:border-indigo-500/40"
            />
            <Button
              size="sm"
              disabled={joining || !joinCode.trim()}
              onClick={() => void onJoin()}
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Join class
            </Button>
          </div>
          {joinMsg && <p className="mt-2 text-xs text-muted">{joinMsg}</p>}
        </Card>

        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <School className="h-4 w-4 text-emerald-400" />
            Enrolled
          </h3>
          {myClasses.length === 0 ? (
            <p className="text-sm text-muted">No classes yet — enter a join code.</p>
          ) : (
            <ul className="space-y-2">
              {myClasses.map((c) => (
                <li
                  key={c.classId}
                  className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-[10px] text-muted">
                    Grade {c.grade} ·{" "}
                    {c.subjectIds
                      .map((id) => getSubject(id)?.name || id)
                      .join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <ClipboardList className="h-4 w-4 text-cyan-400" />
            My assignments
          </h3>
          <Badge>{open.length} open</Badge>
        </div>

        {assignments.length === 0 ? (
          <p className="text-sm text-muted">
            No assignments yet. When your teacher assigns a lesson or exam drill,
            it will show here with a direct link.
          </p>
        ) : (
          <div className="space-y-2">
            {open.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{a.topic}</p>
                  <p className="text-[10px] text-muted">
                    {a.className} · {getSubject(a.subjectId)?.name || a.subjectId} ·{" "}
                    {a.type === "lesson" ? "Lesson" : "Exam drill"} · due {a.dueDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={a.href}>
                    <Button size="sm">Open</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void completeAssignment(a.id)}
                  >
                    Mark done
                  </Button>
                </div>
              </div>
            ))}
            {done.length > 0 && (
              <div className="border-t border-white/5 pt-3">
                <p className="mb-2 text-xs text-muted">Completed</p>
                {done.map((a) => (
                  <div
                    key={a.id}
                    className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-muted line-through">{a.topic}</p>
                      <p className="text-[10px] text-muted">
                        {a.className} · {a.type === "lesson" ? "Lesson" : "Exam drill"}
                      </p>
                    </div>
                    <Badge variant="success">Done</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-muted">
        Teacher with an invite code?{" "}
        <Link href="/teacher" className="text-indigo-400 hover:underline">
          Open teacher console
        </Link>
      </p>
    </>
  );
}
