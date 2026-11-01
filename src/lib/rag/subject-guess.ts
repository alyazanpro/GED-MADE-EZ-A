/**
 * Guess app subjectId from MoE PDF path / filename (Arabic + Latin).
 */

const RULES: { subjectId: string; patterns: RegExp[] }[] = [
  {
    subjectId: "chemistry",
    patterns: [/chem/i, /كيمياء/, /الكيمياء/],
  },
  {
    subjectId: "physics",
    patterns: [/phys/i, /فيزياء/, /الفيزياء/],
  },
  {
    subjectId: "biology",
    patterns: [
      /biol/i,
      /أحياء/,
      /الاحياء/,
      /الأحياء/,
      /بيولوج/,
      /environ/i,
      /بيئي/,
      /بيئة/,
      /العلوم[\s_-]*البيئ/,
      /علوم[\s_-]*بيئ/,
      /العلوم[\s_-]*والبيئة/,
    ],
  },
  {
    subjectId: "math",
    patterns: [/math/i, /رياضيات/, /الرياضيات/, /جبر/, /هندسة/],
  },
  {
    subjectId: "english",
    patterns: [/english/i, /إنجليز/, /الانجليز/, /الإنجليز/, /insight/i, /courseb/i],
  },
  {
    subjectId: "arabic",
    patterns: [/arabic/i, /عربي/, /العربية/, /المؤنس/, /المفيد/, /لغة[\s_-]*عربي/],
  },
  {
    subjectId: "islamic",
    patterns: [/islam/i, /إسلام/, /الاسلام/, /الإسلام/, /تربية[\s_-]*إسلام/],
  },
  {
    subjectId: "ict",
    patterns: [/ict/i, /تقنية[\s_-]*المعلومات/, /الحاسوب/, /حاسوب/, /كمبيوتر/],
  },
  {
    subjectId: "social",
    patterns: [
      /social/i,
      /جغراف/,
      /هذا[\s_-]*وطني/,
      /دراسات[\s_-]*اجتماع/,
      /حضارة/,
      /تاريخ/,
    ],
  },
];

export function guessSubjectId(pathOrName: string): string {
  const s = pathOrName.replace(/\\/g, "/");
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(s))) return rule.subjectId;
  }
  return "general";
}

export function guessGrade(pathOrName: string): number | null {
  const raw = pathOrName.replace(/\\/g, "/");
  const s = raw.toLowerCase();
  if (/grade[-_]?12|g12|الثاني[\s_-]*عشر/.test(s) || /الثاني[\s_-]*عشر/.test(raw)) return 12;
  if (/grade[-_]?11|g11|الحادي[\s_-]*عشر/.test(s) || /الحادي[\s_-]*عشر/.test(raw)) return 11;
  if (/grade[-_]?10|g10/.test(s)) return 10;
  if (/grade[-_]?9\b|g9\b/.test(s)) return 9;
  return null;
}

export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
