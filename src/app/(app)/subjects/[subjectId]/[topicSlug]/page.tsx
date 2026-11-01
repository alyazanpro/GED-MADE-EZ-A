"use client";

import { use } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-sidebar";
import { LessonViewer } from "@/components/learning/lesson-viewer";
import { Button } from "@/components/ui";
import { getSubject } from "@/data/curriculum";
import { getLessonBySlug, getNeighborTopics } from "@/data/lessons";
import { useUserData } from "@/lib/use-user-data";
import { getTopicProgress } from "@/lib/user-data";

export default function TopicLessonPage({
  params,
}: {
  params: Promise<{ subjectId: string; topicSlug: string }>;
}) {
  const { subjectId, topicSlug } = use(params);
  const { data, ready, completeLesson } = useUserData();

  const subject = getSubject(subjectId);
  const lesson = getLessonBySlug(subjectId, topicSlug);

  if (!ready) {
    return <div className="py-20 text-center text-muted">Loading lesson…</div>;
  }

  if (!subject || !lesson) {
    return (
      <div className="space-y-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-white">Lesson not found</h1>
        <p className="text-sm text-muted">
          That topic is not in the MoE catalogue for this subject.
        </p>
        <Link href="/subjects">
          <Button>Back to subjects</Button>
        </Link>
      </div>
    );
  }

  const progress = getTopicProgress(data, subject.id, lesson.topic);
  const neighbors = getNeighborTopics(subject.id, lesson.topic);

  return (
    <>
      <AppHeader
        title="Study"
        highlight={subject.name}
        subtitle="Watch → quiz → save mastery"
        showGreeting={false}
      />
      <LessonViewer
        lesson={lesson}
        subjectName={subject.name}
        subjectId={subject.id}
        mastery={progress.mastery}
        completed={progress.completed}
        prevTopic={neighbors.prev}
        nextTopic={neighbors.next}
        onCompleteLesson={(result) =>
          completeLesson(subject.id, lesson.topic, result)
        }
      />
    </>
  );
}
