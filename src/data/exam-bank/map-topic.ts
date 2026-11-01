import {
  getSubject,
  getTopicsForGrade,
  type GradeLevel,
} from "@/data/curriculum";

/** Common aliases / typos → curriculum canonical (lowercase keys). */
const ALIAS_MAP: Record<string, string> = {
  // Math
  "linear equations": "Linear equations & inequalities",
  "linear equations and inequalities": "Linear equations & inequalities",
  "pythagoras": "Pythagoras theorem",
  "pythagorean theorem": "Pythagoras theorem",
  "trig of right triangles": "Trigonometry of right triangles",
  "right triangle trigonometry": "Trigonometry of right triangles",
  // Physics
  "newtons laws": "Newton's laws",
  "newton's laws of motion": "Newton's laws",
  "work energy power": "Work, energy & power",
  "work, energy and power": "Work, energy & power",
  "waves and sound": "Waves & sound",
  // Chemistry
  "acids bases salts": "Acids, bases & salts",
  "acids, bases and salts": "Acids, bases & salts",
  "atomic structure basics": "Atomic structure",
  // Biology
  "cell structure basic": "Cell structure basics",
  "cells structure": "Cell structure",
  "digestive system": "Human digestive system",
  "human digestion": "Human digestive system",
  "genetics": "Genetics basics",
  "ecology": "Ecology & environment",
  // English
  "reading comprehension skills": "Reading comprehension",
  "essay writing": "Essay structure",
  "grammar": "Grammar essentials",
  // ICT
  "computer basics": "Computer fundamentals",
  "spreadsheet intro": "Spreadsheets intro",
  "cyber security": "Cybersecurity awareness",
  "cybersecurity": "Cybersecurity awareness",
  // Arabic (Latin transliterations → exact Arabic curriculum strings)
  "qiraa": "القراءة والفهم",
  "reading and comprehension": "القراءة والفهم",
  "nahw": "النحو الأساسي",
  "basic grammar arabic": "النحو الأساسي",
  // Islamic
  "aqidah": "العقيدة وأدلة الإيمان",
  "fiqh ibadat": "فقه العبادات",
  // Social
  "oman geography": "جغرافية سلطنة عمان",
  "geography of oman": "جغرافية سلطنة عمان",
  "this is my homeland": "هذا وطني",
};

function normalizeKey(raw: string): string {
  return raw
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}\s'-]/gu, "");
}

function stripDiacriticsAr(s: string): string {
  return s.replace(/[\u064B-\u065F\u0670]/g, "");
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;
  if (longer.includes(shorter) && shorter.length >= 4) {
    return shorter.length / longer.length;
  }
  // token overlap
  const ta = new Set(a.split(/\s+/).filter(Boolean));
  const tb = new Set(b.split(/\s+/).filter(Boolean));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Map a free-form / alias topic string to an exact curriculum.topicsByGrade entry.
 * Returns null if no confident match for the subject (+ optional grade).
 */
export function mapTopicToCurriculum(
  subjectId: string,
  topic: string,
  grade?: GradeLevel
): string | null {
  const subject = getSubject(subjectId);
  if (!subject) return null;
  const raw = topic?.trim();
  if (!raw) return null;

  const pool: string[] = grade
    ? getTopicsForGrade(subject, grade)
    : [
        ...new Set(
          ([9, 10, 11, 12] as GradeLevel[]).flatMap((g) =>
            getTopicsForGrade(subject, g)
          )
        ),
      ];

  if (pool.length === 0) return null;

  // Exact match
  if (pool.includes(raw)) return raw;

  // Alias table
  const aliasHit = ALIAS_MAP[normalizeKey(raw)];
  if (aliasHit && pool.includes(aliasHit)) return aliasHit;
  // Alias may resolve to another grade's wording — try fuzzy against pool
  if (aliasHit) {
    const exactElsewhere = pool.find((t) => t === aliasHit);
    if (exactElsewhere) return exactElsewhere;
  }

  const key = normalizeKey(raw);
  const keyAr = stripDiacriticsAr(raw);

  // Normalized exact / diacritic-insensitive
  for (const t of pool) {
    if (normalizeKey(t) === key) return t;
    if (stripDiacriticsAr(t) === keyAr) return t;
  }

  // Fuzzy: best similarity ≥ 0.72
  let best: string | null = null;
  let bestScore = 0;
  for (const t of pool) {
    const score = Math.max(
      similarity(normalizeKey(t), key),
      similarity(stripDiacriticsAr(t), keyAr)
    );
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  if (best && bestScore >= 0.72) return best;

  return null;
}

/**
 * Resolve topic for filtering / CTAs. Falls back to original if unmapped
 * (validation script will catch bank mismatches).
 */
export function resolveExamTopic(
  subjectId: string,
  topic: string,
  grade?: GradeLevel
): string {
  return mapTopicToCurriculum(subjectId, topic, grade) ?? topic.trim();
}

export function hasArabicExamFields(q: {
  promptAr?: string;
  choicesAr?: string[];
  explanationAr?: string;
}): boolean {
  return Boolean(
    q.promptAr?.trim() ||
      (q.choicesAr && q.choicesAr.length > 0) ||
      q.explanationAr?.trim()
  );
}
