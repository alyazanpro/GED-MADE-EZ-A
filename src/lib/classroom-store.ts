import { SUBJECT_CATALOG, type GradeLevel } from "@/data/curriculum";
import { topicToSlug } from "@/data/lessons/utils";
import { normalizeEmail } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  AssignmentCompletion,
  AssignmentType,
  ClassAssignment,
  ClassInsights,
  ClassMembership,
  ClassRoom,
  ClassroomStore,
  RosterStudent,
  StudentAssignmentView,
  StudentProgressSnapshot,
  TeacherGrant,
  TopicSnapshot,
} from "@/lib/classroom-types";

export type { StudentAssignmentView };

/** Serialize read-modify-write so concurrent progress sync / class edits cannot wipe each other. */
let storeQueue: Promise<unknown> = Promise.resolve();

function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = storeQueue.then(fn, fn);
  storeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function emptyStore(): ClassroomStore {
  return {
    teachers: {},
    classes: {},
    memberships: [],
    assignments: [],
    completions: [],
    progress: {},
  };
}

export async function loadClassroomStore(): Promise<ClassroomStore> {
  const supabase = createServiceClient();
  const store = emptyStore();

  const [
    teachersRes,
    classesRes,
    membershipsRes,
    assignmentsRes,
    completionsRes,
    progressRes,
  ] = await Promise.all([
    supabase.from("teacher_grants").select("*"),
    supabase.from("classes").select("*"),
    supabase.from("class_memberships").select("*"),
    supabase.from("assignments").select("*"),
    supabase.from("assignment_completions").select("*"),
    supabase.from("student_progress").select("*"),
  ]);

  for (const t of teachersRes.data || []) {
    store.teachers[t.email] = {
      email: t.email,
      grantedAt: t.granted_at,
      source: t.source,
      grantedBy: t.granted_by || undefined,
    };
  }

  for (const c of classesRes.data || []) {
    store.classes[c.class_id] = {
      classId: c.class_id,
      name: c.name,
      grade: c.grade,
      subjectIds: c.subject_ids || [],
      joinCode: c.join_code,
      teacherId: c.teacher_id,
      teacherEmail: c.teacher_email,
      teacherName: c.teacher_name || "",
      createdAt: c.created_at,
    };
  }

  store.memberships = (membershipsRes.data || []).map((m) => ({
    studentId: m.student_id,
    studentEmail: m.student_email,
    studentName: m.student_name || "",
    classId: m.class_id,
    joinedAt: m.joined_at,
  }));

  store.assignments = (assignmentsRes.data || []).map((a) => ({
    id: a.id,
    classId: a.class_id,
    type: a.type,
    subjectId: a.subject_id,
    topic: a.topic,
    topicSlug: a.topic_slug,
    dueDate: a.due_date,
    createdAt: a.created_at,
    createdBy: a.created_by,
  }));

  store.completions = (completionsRes.data || []).map((c) => ({
    assignmentId: c.assignment_id,
    studentId: c.student_id,
    completedAt: c.completed_at,
  }));

  for (const p of progressRes.data || []) {
    store.progress[p.student_id] = {
      studentId: p.student_id,
      studentEmail: p.student_email,
      studentName: p.student_name || "",
      updatedAt: p.updated_at,
      lastActiveAt: p.last_active_at,
      topics: (p.topics || {}) as Record<string, TopicSnapshot>,
      examFocusGrade: p.exam_focus_grade,
      recentExamAccuracy:
        p.recent_exam_accuracy == null ? null : Number(p.recent_exam_accuracy),
      version: p.version ?? 0,
    };
  }

  return store;
}

async function writeStore(store: ClassroomStore, previous: ClassroomStore): Promise<void> {
  const supabase = createServiceClient();

  const teacherRows = Object.values(store.teachers).map((t) => ({
    email: t.email,
    granted_at: t.grantedAt,
    source: t.source,
    granted_by: t.grantedBy || null,
  }));

  const classRows = Object.values(store.classes).map((c) => ({
    class_id: c.classId,
    name: c.name,
    grade: c.grade,
    subject_ids: c.subjectIds,
    join_code: c.joinCode,
    teacher_id: c.teacherId,
    teacher_email: c.teacherEmail,
    teacher_name: c.teacherName,
    created_at: c.createdAt,
  }));

  const membershipRows = store.memberships.map((m) => ({
    student_id: m.studentId,
    class_id: m.classId,
    student_email: m.studentEmail,
    student_name: m.studentName,
    joined_at: m.joinedAt,
  }));

  const assignmentRows = store.assignments.map((a) => ({
    id: a.id,
    class_id: a.classId,
    type: a.type,
    subject_id: a.subjectId,
    topic: a.topic,
    topic_slug: a.topicSlug,
    due_date: a.dueDate,
    created_at: a.createdAt,
    created_by: a.createdBy,
  }));

  const completionRows = store.completions.map((c) => ({
    assignment_id: c.assignmentId,
    student_id: c.studentId,
    completed_at: c.completedAt,
  }));

  const progressRows = Object.values(store.progress).map((p) => ({
    student_id: p.studentId,
    student_email: p.studentEmail,
    student_name: p.studentName,
    updated_at: p.updatedAt,
    last_active_at: p.lastActiveAt,
    topics: p.topics,
    exam_focus_grade: p.examFocusGrade,
    recent_exam_accuracy: p.recentExamAccuracy ?? null,
    version: p.version ?? 0,
  }));

  const sync = async <T>(options: {
    table: string;
    current: T[];
    previous: T[];
    key: (value: T) => string;
    row: (value: T) => Record<string, unknown>;
    delete: (value: T) => PromiseLike<{ error: { message: string } | null }>;
  }) => {
    const previousByKey = new Map(options.previous.map((value) => [options.key(value), JSON.stringify(value)]));
    const currentKeys = new Set(options.current.map(options.key));
    for (const value of options.previous) {
      if (!currentKeys.has(options.key(value))) {
        const { error } = await options.delete(value);
        if (error) throw new Error(error.message);
      }
    }
    const changedRows = options.current.filter(
      (value) => JSON.stringify(value) !== previousByKey.get(options.key(value))
    ).map(options.row);
    if (changedRows.length) {
      const { error } = await supabase.from(options.table).upsert(changedRows);
      if (error) throw new Error(error.message);
    }
  };

  await sync({
    table: "assignment_completions", current: completionRows,
    previous: Object.values(previous.completions).map((c) => ({ assignment_id: c.assignmentId, student_id: c.studentId, completed_at: c.completedAt })),
    key: (c) => `${c.assignment_id}:${c.student_id}`, row: (c) => c,
    delete: (c) => supabase.from("assignment_completions").delete().eq("assignment_id", c.assignment_id).eq("student_id", c.student_id)
  });
  await sync({
    table: "assignments", current: assignmentRows,
    previous: Object.values(previous.assignments).map((a) => ({ id: a.id, class_id: a.classId, type: a.type, subject_id: a.subjectId, topic: a.topic, topic_slug: a.topicSlug, due_date: a.dueDate, created_at: a.createdAt, created_by: a.createdBy })),
    key: (a) => a.id, row: (a) => a,
    delete: (a) => supabase.from("assignments").delete().eq("id", a.id)
  });
  await sync({
    table: "class_memberships", current: membershipRows,
    previous: previous.memberships.map((m) => ({ student_id: m.studentId, class_id: m.classId, student_email: m.studentEmail, student_name: m.studentName, joined_at: m.joinedAt })),
    key: (m) => `${m.student_id}:${m.class_id}`, row: (m) => m,
    delete: (m) => supabase.from("class_memberships").delete().eq("student_id", m.student_id).eq("class_id", m.class_id)
  });
  await sync({
    table: "classes", current: classRows,
    previous: Object.values(previous.classes).map((c) => ({ class_id: c.classId, name: c.name, grade: c.grade, subject_ids: c.subjectIds, join_code: c.joinCode, teacher_id: c.teacherId, teacher_email: c.teacherEmail, teacher_name: c.teacherName, created_at: c.createdAt })),
    key: (c) => c.class_id, row: (c) => c,
    delete: (c) => supabase.from("classes").delete().eq("class_id", c.class_id)
  });
  await sync({
    table: "teacher_grants", current: teacherRows,
    previous: Object.values(previous.teachers).map((t) => ({ email: t.email, granted_at: t.grantedAt, source: t.source, granted_by: t.grantedBy || null })),
    key: (t) => t.email, row: (t) => t,
    delete: (t) => supabase.from("teacher_grants").delete().eq("email", t.email)
  });
  await sync({
    table: "student_progress", current: progressRows,
    previous: Object.values(previous.progress).map((p) => ({ student_id: p.studentId, student_email: p.studentEmail, student_name: p.studentName, updated_at: p.updatedAt, last_active_at: p.lastActiveAt, topics: p.topics, exam_focus_grade: p.examFocusGrade, recent_exam_accuracy: p.recentExamAccuracy ?? null, version: p.version ?? 0 })),
    key: (p) => p.student_id, row: (p) => p,
    delete: (p) => supabase.from("student_progress").delete().eq("student_id", p.student_id)
  });
}

/** Load → mutate → atomic write under the process-wide lock. */
export async function updateStore(
  mutator: (store: ClassroomStore) => void | Promise<void>
): Promise<ClassroomStore> {
  return withStoreLock(async () => {
    const previous = await loadClassroomStore();
    const store = structuredClone(previous);
    await mutator(store);
    await writeStore(store, previous);
    return store;
  });
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateJoinCode(existing: Set<string>): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 40; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    if (!existing.has(code)) return code;
  }
  return `C${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export async function grantTeacherRole(input: {
  email: string;
  source: TeacherGrant["source"];
  grantedBy?: string;
}): Promise<TeacherGrant> {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error("Valid email required.");

  const grant: TeacherGrant = {
    email,
    grantedAt: new Date().toISOString(),
    source: input.source,
    grantedBy: input.grantedBy,
  };
  await updateStore((store) => {
    store.teachers[email] = grant;
  });
  return grant;
}

export async function createClass(input: {
  name: string;
  grade: GradeLevel;
  subjectIds: string[];
  teacherId: string;
  teacherEmail: string;
  teacherName: string;
}): Promise<ClassRoom> {
  let room!: ClassRoom;
  await updateStore((store) => {
    const existingCodes = new Set(
      Object.values(store.classes).map((c) => c.joinCode.toUpperCase())
    );
    const classId = uid("class");
    room = {
      classId,
      name: input.name.trim().slice(0, 80) || "Untitled class",
      grade: input.grade,
      subjectIds: input.subjectIds.filter(Boolean).slice(0, 12),
      joinCode: generateJoinCode(existingCodes),
      teacherId: input.teacherId,
      teacherEmail: normalizeEmail(input.teacherEmail),
      teacherName: input.teacherName || input.teacherEmail.split("@")[0],
      createdAt: new Date().toISOString(),
    };
    store.classes[classId] = room;
  });
  return room;
}

export async function listClassesForTeacher(teacherEmail: string): Promise<ClassRoom[]> {
  const store = await loadClassroomStore();
  const email = normalizeEmail(teacherEmail);
  return Object.values(store.classes)
    .filter((c) => c.teacherEmail === email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getClassById(classId: string): Promise<ClassRoom | null> {
  const store = await loadClassroomStore();
  return store.classes[classId] || null;
}

export async function joinClassWithCode(input: {
  joinCode: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
}): Promise<{ class: ClassRoom; membership: ClassMembership; alreadyJoined: boolean }> {
  let result!: { class: ClassRoom; membership: ClassMembership; alreadyJoined: boolean };
  await updateStore((store) => {
    const code = input.joinCode.trim().toUpperCase();
    const room = Object.values(store.classes).find((c) => c.joinCode === code);
    if (!room) throw new Error("Invalid class code.");

    const studentId = input.studentId || normalizeEmail(input.studentEmail);
    const existing = store.memberships.find(
      (m) => m.classId === room.classId && m.studentId === studentId
    );
    if (existing) {
      result = { class: room, membership: existing, alreadyJoined: true };
      return;
    }

    const membership: ClassMembership = {
      studentId,
      studentEmail: normalizeEmail(input.studentEmail),
      studentName: input.studentName || input.studentEmail.split("@")[0],
      classId: room.classId,
      joinedAt: new Date().toISOString(),
    };
    store.memberships.push(membership);
    result = { class: room, membership, alreadyJoined: false };
  });
  return result;
}

export async function listMembershipsForStudent(studentId: string): Promise<
  { membership: ClassMembership; class: ClassRoom }[]
> {
  const store = await loadClassroomStore();
  return store.memberships
    .filter((m) => m.studentId === studentId)
    .map((m) => ({ membership: m, class: store.classes[m.classId] }))
    .filter((x): x is { membership: ClassMembership; class: ClassRoom } => Boolean(x.class))
    .sort((a, b) => b.membership.joinedAt.localeCompare(a.membership.joinedAt));
}

export async function createAssignment(input: {
  classId: string;
  type: AssignmentType;
  subjectId: string;
  topic: string;
  dueDate: string;
  createdBy: string;
}): Promise<ClassAssignment> {
  const topic = input.topic.trim();
  if (!topic) throw new Error("Topic is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
    throw new Error("Due date must be YYYY-MM-DD.");
  }

  let assignment!: ClassAssignment;
  await updateStore((store) => {
    const room = store.classes[input.classId];
    if (!room) throw new Error("Class not found.");

    assignment = {
      id: uid("asg"),
      classId: input.classId,
      type: input.type,
      subjectId: input.subjectId,
      topic,
      topicSlug: topicToSlug(topic),
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
    };
    store.assignments.unshift(assignment);
  });
  return assignment;
}

export async function listAssignmentsForClass(classId: string): Promise<ClassAssignment[]> {
  const store = await loadClassroomStore();
  return store.assignments
    .filter((a) => a.classId === classId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function assignmentHref(a: ClassAssignment, grade: GradeLevel): string {
  if (a.type === "exam_drill") {
    const params = new URLSearchParams({
      subject: a.subjectId,
      grade: String(grade),
      mode: "topic",
      topic: a.topic,
      count: "5",
    });
    return `/exams/session?${params.toString()}`;
  }
  return `/subjects/${a.subjectId}/${a.topicSlug}`;
}

export async function listAssignmentsForStudent(
  studentId: string
): Promise<StudentAssignmentView[]> {
  const store = await loadClassroomStore();
  const classIds = store.memberships
    .filter((m) => m.studentId === studentId)
    .map((m) => m.classId);
  const completed = new Set(
    store.completions
      .filter((c) => c.studentId === studentId)
      .map((c) => c.assignmentId)
  );
  const completionAt = new Map(
    store.completions
      .filter((c) => c.studentId === studentId)
      .map((c) => [c.assignmentId, c.completedAt])
  );

  return store.assignments
    .filter((a) => classIds.includes(a.classId))
    .map((a) => {
      const room = store.classes[a.classId];
      return {
        ...a,
        className: room?.name || "Class",
        completed: completed.has(a.id),
        completedAt: completionAt.get(a.id) || null,
        href: assignmentHref(a, room?.grade || 9),
      };
    })
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate));
}

export async function markAssignmentComplete(input: {
  assignmentId: string;
  studentId: string;
}): Promise<AssignmentCompletion | null> {
  let result: AssignmentCompletion | null = null;
  await updateStore((store) => {
    const assignment = store.assignments.find((a) => a.id === input.assignmentId);
    if (!assignment) return;

    const isMember = store.memberships.some(
      (m) => m.classId === assignment.classId && m.studentId === input.studentId
    );
    if (!isMember) return;

    const existing = store.completions.find(
      (c) => c.assignmentId === input.assignmentId && c.studentId === input.studentId
    );
    if (existing) {
      result = existing;
      return;
    }

    const completion: AssignmentCompletion = {
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      completedAt: new Date().toISOString(),
    };
    store.completions.push(completion);
    result = completion;
  });
  return result;
}

/** Auto-complete lesson / exam assignments that match subject + topic */
export async function completeMatchingAssignments(input: {
  studentId: string;
  subjectId: string;
  topic: string;
  type?: AssignmentType;
}): Promise<number> {
  let count = 0;
  await updateStore((store) => {
    const classIds = new Set(
      store.memberships.filter((m) => m.studentId === input.studentId).map((m) => m.classId)
    );
    const topicNorm = input.topic.trim().toLowerCase();

    for (const a of store.assignments) {
      if (!classIds.has(a.classId)) continue;
      if (a.subjectId !== input.subjectId) continue;
      if (a.topic.trim().toLowerCase() !== topicNorm) continue;
      if (input.type && a.type !== input.type) continue;

      const already = store.completions.some(
        (c) => c.assignmentId === a.id && c.studentId === input.studentId
      );
      if (already) continue;

      store.completions.push({
        assignmentId: a.id,
        studentId: input.studentId,
        completedAt: new Date().toISOString(),
      });
      count += 1;
    }
  });
  return count;
}

export async function syncStudentProgress(input: {
  studentId: string;
  studentEmail: string;
  studentName: string;
  topics: Record<string, TopicSnapshot>;
  lastActiveAt: string | null;
  examFocusGrade: GradeLevel | null;
  recentExamAccuracy?: number | null;
  version?: number; // Add version for optimistic locking
}): Promise<StudentProgressSnapshot> {
  let snapshot!: StudentProgressSnapshot;
  await updateStore((store) => {
    const existing = store.progress[input.studentId];
    
    // Optimistic locking check
    if (input.version !== undefined && existing && existing.version !== input.version) {
      throw new Error("Concurrent modification detected. Please refresh and try again.");
    }
    
    snapshot = {
      studentId: input.studentId,
      studentEmail: normalizeEmail(input.studentEmail),
      studentName: input.studentName || input.studentEmail.split("@")[0],
      updatedAt: new Date().toISOString(),
      lastActiveAt: input.lastActiveAt,
      topics: input.topics || {},
      examFocusGrade: input.examFocusGrade,
      recentExamAccuracy:
        typeof input.recentExamAccuracy === "number"
          ? input.recentExamAccuracy
          : input.recentExamAccuracy === null
            ? null
            : store.progress[input.studentId]?.recentExamAccuracy ?? null,
      // Add version field
      version: (existing?.version || 0) + 1
    };
    store.progress[input.studentId] = snapshot;
  });
  return snapshot;
}

function subjectName(subjectId: string) {
  return SUBJECT_CATALOG.find((s) => s.id === subjectId)?.name || subjectId;
}

function overallFromTopics(topics: Record<string, TopicSnapshot>): number {
  const values = Object.values(topics);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((s, t) => s + t.mastery, 0) / values.length);
}

export async function getClassRoster(classId: string): Promise<RosterStudent[]> {
  const store = await loadClassroomStore();
  return store.memberships
    .filter((m) => m.classId === classId)
    .map((m) => {
      const snap = store.progress[m.studentId];
      return {
        studentId: m.studentId,
        studentEmail: m.studentEmail,
        studentName: m.studentName,
        joinedAt: m.joinedAt,
        lastActiveAt: snap?.lastActiveAt || null,
        overallMastery: snap ? overallFromTopics(snap.topics) : 0,
        topicsStudied: snap ? Object.keys(snap.topics).length : 0,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export async function computeClassInsights(classId: string): Promise<ClassInsights> {
  const store = await loadClassroomStore();
  const room = store.classes[classId];
  const members = store.memberships.filter((m) => m.classId === classId);
  const snapshots = members
    .map((m) => store.progress[m.studentId])
    .filter((s): s is StudentProgressSnapshot => Boolean(s));

  const subjectIds =
    room?.subjectIds?.length
      ? room.subjectIds
      : [...new Set(snapshots.flatMap((s) => Object.keys(s.topics).map((k) => k.split("::")[0])))];

  const averageMasteryBySubject = subjectIds.map((subjectId) => {
    const scores: number[] = [];
    for (const snap of snapshots) {
      const topicScores = Object.entries(snap.topics)
        .filter(([key]) => key.startsWith(`${subjectId}::`))
        .map(([, t]) => t.mastery);
      if (topicScores.length) {
        scores.push(
          Math.round(topicScores.reduce((a, b) => a + b, 0) / topicScores.length)
        );
      }
    }
    return {
      subjectId,
      subjectName: subjectName(subjectId),
      averageMastery: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
      studentCount: scores.length,
    };
  });

  const topicAgg = new Map<
    string,
    { subjectId: string; topic: string; sum: number; count: number }
  >();
  for (const snap of snapshots) {
    for (const [key, t] of Object.entries(snap.topics)) {
      const [subjectId, ...rest] = key.split("::");
      const topic = rest.join("::");
      if (!subjectId || !topic) continue;
      const cur = topicAgg.get(key) || { subjectId, topic, sum: 0, count: 0 };
      cur.sum += t.mastery;
      cur.count += 1;
      topicAgg.set(key, cur);
    }
  }

  const weakTopics = [...topicAgg.values()]
    .map((t) => ({
      subjectId: t.subjectId,
      subjectName: subjectName(t.subjectId),
      topic: t.topic,
      averageMastery: Math.round(t.sum / t.count),
      studentCount: t.count,
    }))
    .filter((t) => t.averageMastery < 70)
    .sort((a, b) => a.averageMastery - b.averageMastery || b.studentCount - a.studentCount)
    .slice(0, 12);

  const now = Date.now();
  const inactiveStudents = members
    .map((m) => {
      const snap = store.progress[m.studentId];
      const last = snap?.lastActiveAt || null;
      const daysInactive = last
        ? Math.floor((now - new Date(last).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      return {
        studentId: m.studentId,
        studentEmail: m.studentEmail,
        studentName: m.studentName,
        lastActiveAt: last,
        daysInactive,
      };
    })
    .filter((s) => s.daysInactive > 7)
    .sort((a, b) => b.daysInactive - a.daysInactive);

  return { averageMasteryBySubject, weakTopics, inactiveStudents };
}

export async function getStudentDetailForTeacher(input: {
  classId: string;
  studentId: string;
  teacherEmail: string;
  /** When true, skip teacher ownership check (super-admin support). */
  bypassOwnerCheck?: boolean;
}): Promise<{
  membership: ClassMembership;
  progress: StudentProgressSnapshot | null;
  recentTopics: { subjectId: string; topic: string; mastery: number; lastStudiedAt: string | null }[];
} | null> {
  const store = await loadClassroomStore();
  const room = store.classes[input.classId];
  if (!room) return null;
  if (
    !input.bypassOwnerCheck &&
    normalizeEmail(room.teacherEmail) !== normalizeEmail(input.teacherEmail)
  ) {
    return null;
  }
  const membership = store.memberships.find(
    (m) => m.classId === input.classId && m.studentId === input.studentId
  );
  if (!membership) return null;

  const progress = store.progress[input.studentId] || null;
  const recentTopics = progress
    ? Object.entries(progress.topics)
        .map(([key, t]) => {
          const [subjectId, ...rest] = key.split("::");
          return {
            subjectId,
            topic: rest.join("::"),
            mastery: t.mastery,
            lastStudiedAt: t.lastStudiedAt,
          };
        })
        .sort((a, b) =>
          (b.lastStudiedAt || "").localeCompare(a.lastStudiedAt || "")
        )
        .slice(0, 20)
    : [];

  return { membership, progress, recentTopics };
}

export async function getAssignmentCompletionStats(classId: string) {
  const store = await loadClassroomStore();
  const memberCount = store.memberships.filter((m) => m.classId === classId).length;
  return store.assignments
    .filter((a) => a.classId === classId)
    .map((a) => {
      const done = store.completions.filter((c) => c.assignmentId === a.id).length;
      return { assignmentId: a.id, completedCount: done, memberCount };
    });
}
