const fs = require("fs");
const path = require("path");

function q(s) {
  if (s === null || s === undefined) return "null";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function j(obj) {
  return "$json$" + JSON.stringify(obj) + "$json$::jsonb";
}

const root = path.join(__dirname, "..");
const classrooms = JSON.parse(
  fs.readFileSync(path.join(root, "data", "classrooms.json"), "utf8")
);
const signins = JSON.parse(
  fs.readFileSync(path.join(root, "data", "google-signins.json"), "utf8")
);

const parts = [];

parts.push("-- signin users");
for (const u of Object.values(signins.users || {})) {
  parts.push(
    `insert into public.signin_users (id, email, name, picture, first_seen_at, last_seen_at, continue_count) values (${q(u.id)}, ${q(u.email)}, ${q(u.name)}, ${q(u.picture || "")}, ${q(u.firstSeenAt)}, ${q(u.lastSeenAt)}, ${u.continueCount || 1}) on conflict (id) do update set email=excluded.email, name=excluded.name, picture=excluded.picture, last_seen_at=excluded.last_seen_at, continue_count=excluded.continue_count;`
  );
}

parts.push("-- signin events");
for (const e of signins.events || []) {
  parts.push(
    `insert into public.signin_events (id, user_id, email, name, at) values (${q(e.id)}, ${q(e.userId)}, ${q(e.email)}, ${q(e.name)}, ${q(e.at)}) on conflict (id) do nothing;`
  );
}

parts.push("-- teacher grants");
for (const t of Object.values(classrooms.teachers || {})) {
  parts.push(
    `insert into public.teacher_grants (email, granted_at, source, granted_by) values (${q(t.email)}, ${q(t.grantedAt)}, ${q(t.source)}, ${t.grantedBy ? q(t.grantedBy) : "null"}) on conflict (email) do update set granted_at=excluded.granted_at, source=excluded.source, granted_by=excluded.granted_by;`
  );
}

parts.push("-- classes");
for (const c of Object.values(classrooms.classes || {})) {
  const subjects =
    "ARRAY[" +
    (c.subjectIds || []).map((s) => q(s)).join(",") +
    "]::text[]";
  parts.push(
    `insert into public.classes (class_id, name, grade, subject_ids, join_code, teacher_id, teacher_email, teacher_name, created_at) values (${q(c.classId)}, ${q(c.name)}, ${c.grade}, ${subjects}, ${q(c.joinCode)}, ${q(c.teacherId)}, ${q(c.teacherEmail)}, ${q(c.teacherName)}, ${q(c.createdAt)}) on conflict (class_id) do update set name=excluded.name, grade=excluded.grade, subject_ids=excluded.subject_ids, join_code=excluded.join_code, teacher_id=excluded.teacher_id, teacher_email=excluded.teacher_email, teacher_name=excluded.teacher_name;`
  );
}

parts.push("-- memberships");
for (const m of classrooms.memberships || []) {
  parts.push(
    `insert into public.class_memberships (student_id, class_id, student_email, student_name, joined_at) values (${q(m.studentId)}, ${q(m.classId)}, ${q(m.studentEmail)}, ${q(m.studentName)}, ${q(m.joinedAt)}) on conflict (student_id, class_id) do update set student_email=excluded.student_email, student_name=excluded.student_name, joined_at=excluded.joined_at;`
  );
}

parts.push("-- assignments");
for (const a of classrooms.assignments || []) {
  parts.push(
    `insert into public.assignments (id, class_id, type, subject_id, topic, topic_slug, due_date, created_at, created_by) values (${q(a.id)}, ${q(a.classId)}, ${q(a.type)}, ${q(a.subjectId)}, ${q(a.topic)}, ${q(a.topicSlug)}, ${q(a.dueDate)}, ${q(a.createdAt)}, ${q(a.createdBy)}) on conflict (id) do update set class_id=excluded.class_id, type=excluded.type, subject_id=excluded.subject_id, topic=excluded.topic, topic_slug=excluded.topic_slug, due_date=excluded.due_date, created_by=excluded.created_by;`
  );
}

parts.push("-- completions");
for (const c of classrooms.completions || []) {
  parts.push(
    `insert into public.assignment_completions (assignment_id, student_id, completed_at) values (${q(c.assignmentId)}, ${q(c.studentId)}, ${q(c.completedAt)}) on conflict (assignment_id, student_id) do update set completed_at=excluded.completed_at;`
  );
}

parts.push("-- student progress");
for (const p of Object.values(classrooms.progress || {})) {
  const grade = p.examFocusGrade == null ? "null" : p.examFocusGrade;
  const acc = p.recentExamAccuracy == null ? "null" : p.recentExamAccuracy;
  parts.push(
    `insert into public.student_progress (student_id, student_email, student_name, updated_at, last_active_at, topics, exam_focus_grade, recent_exam_accuracy) values (${q(p.studentId)}, ${q(p.studentEmail)}, ${q(p.studentName)}, ${q(p.updatedAt)}, ${p.lastActiveAt ? q(p.lastActiveAt) : "null"}, ${j(p.topics || {})}, ${grade}, ${acc}) on conflict (student_id) do update set student_email=excluded.student_email, student_name=excluded.student_name, updated_at=excluded.updated_at, last_active_at=excluded.last_active_at, topics=excluded.topics, exam_focus_grade=excluded.exam_focus_grade, recent_exam_accuracy=excluded.recent_exam_accuracy;`
  );
}

const dir = path.join(root, "data", "user-learning");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const userId = f.replace(/\.json$/, "");
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const updatedAt = data.updatedAt || new Date().toISOString();
  const version = data.version || 2;
  parts.push(
    `insert into public.user_learning (user_id, version, data, updated_at) values (${q(userId)}, ${version}, ${j(data)}, ${q(updatedAt)}) on conflict (user_id) do update set version=excluded.version, data=excluded.data, updated_at=excluded.updated_at;`
  );
}

const out = path.join(root, "supabase-migrate-data.sql");
fs.writeFileSync(out, parts.join("\n"));
console.log("Wrote", parts.length, "statements,", fs.statSync(out).size, "bytes");
