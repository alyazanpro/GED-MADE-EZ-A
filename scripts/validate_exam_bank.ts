/**
 * Validate exam bank integrity against MoE curriculum topic strings.
 * Fail if: topic not in curriculum, missing/invalid correctIndex for MCQ,
 * empty explanation, duplicate ids.
 *
 * Run: npx tsx scripts/validate_exam_bank.ts
 */
import { SUBJECT_CATALOG, getTopicsForGrade, type GradeLevel } from "../src/data/curriculum";
import { EXAM_BANK } from "../src/data/exam-bank";
import { mapTopicToCurriculum } from "../src/data/exam-bank/map-topic";

type Issue = { id: string; message: string };

const issues: Issue[] = [];

function fail(id: string, message: string) {
  issues.push({ id, message });
}

const seenIds = new Set<string>();

for (const q of EXAM_BANK) {
  if (!q.id?.trim()) {
    fail("(missing)", "Question missing id");
    continue;
  }

  if (seenIds.has(q.id)) {
    fail(q.id, "Duplicate id");
  }
  seenIds.add(q.id);

  const subject = SUBJECT_CATALOG.find((s) => s.id === q.subjectId);
  if (!subject) {
    fail(q.id, `Unknown subjectId "${q.subjectId}"`);
    continue;
  }

  const grade = q.grade as GradeLevel;
  const allowed = getTopicsForGrade(subject, grade);
  if (!allowed.includes(q.topic)) {
    const mapped = mapTopicToCurriculum(q.subjectId, q.topic, grade);
    fail(
      q.id,
      `Topic "${q.topic}" not in curriculum for ${q.subjectId} G${grade}` +
        (mapped ? ` (closest map: "${mapped}")` : "")
    );
  }

  if (!q.explanation?.trim()) {
    fail(q.id, "Empty explanation");
  }

  if (q.type === "mcq") {
    if (!q.choices || q.choices.length < 2) {
      fail(q.id, "MCQ missing choices");
    } else {
      const idx = Number(q.correctAnswer);
      if (
        !Number.isInteger(idx) ||
        String(idx) !== String(q.correctAnswer).trim() ||
        idx < 0 ||
        idx >= q.choices.length
      ) {
        fail(
          q.id,
          `Invalid correctIndex "${q.correctAnswer}" for ${q.choices.length} choices`
        );
      }
    }
    if (q.choicesAr && q.choices && q.choicesAr.length !== q.choices.length) {
      fail(
        q.id,
        `choicesAr length ${q.choicesAr.length} != choices length ${q.choices.length}`
      );
    }
  } else if (!q.correctAnswer?.trim()) {
    fail(q.id, "Missing correctAnswer");
  }

  if (![9, 10, 11, 12].includes(q.grade)) {
    fail(q.id, `Invalid grade ${q.grade}`);
  }
}

// Summary counts
const bySubject = new Map<string, number>();
for (const q of EXAM_BANK) {
  bySubject.set(q.subjectId, (bySubject.get(q.subjectId) || 0) + 1);
}

console.log(`Exam bank: ${EXAM_BANK.length} questions`);
for (const [sid, n] of [...bySubject.entries()].sort()) {
  console.log(`  ${sid}: ${n}`);
}

if (issues.length > 0) {
  console.error(`\nFAIL: ${issues.length} issue(s)`);
  for (const i of issues.slice(0, 80)) {
    console.error(`  [${i.id}] ${i.message}`);
  }
  if (issues.length > 80) {
    console.error(`  … and ${issues.length - 80} more`);
  }
  process.exit(1);
}

console.log("\nOK: validate_exam_bank passed");
