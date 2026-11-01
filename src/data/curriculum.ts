import {
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Languages,
  Globe2,
  BookOpen,
  Moon,
  Monitor,
  type LucideIcon,
} from "lucide-react";

export type SubjectColor =
  | "indigo"
  | "blue"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "violet"
  | "teal";

/** Oman MoE pathway: 9–10 Basic Education · 11–12 General Education Diploma (GED) */
export type GradeLevel = 9 | 10 | 11 | 12;

export type StageId = "basic" | "ged";

export type SubjectDef = {
  id: string;
  name: string;
  nameAr?: string;
  icon: LucideIcon;
  color: SubjectColor;
  description: string;
  /** Which pathway stages this subject appears in */
  stages: StageId[];
  /** Grades this subject is taught */
  grades: GradeLevel[];
  /** All unique topics (for progress / library) */
  topics: string[];
  /** MoE-aligned topics by grade */
  topicsByGrade: Record<GradeLevel, string[]>;
};

export const STAGE_META: Record<
  StageId,
  { id: StageId; label: string; labelAr: string; grades: GradeLevel[]; blurb: string }
> = {
  basic: {
    id: "basic",
    label: "Basic Education",
    labelAr: "التعليم الأساسي",
    grades: [9, 10],
    blurb: "Grades 9–10 foundation years that prepare students for the diploma pathway.",
  },
  ged: {
    id: "ged",
    label: "General Education Diploma",
    labelAr: "دبلوم التعليم العام",
    grades: [11, 12],
    blurb: "Grades 11–12 post-basic programme with MoE exams and university pathways.",
  },
};

export const GRADE_META: Record<
  GradeLevel,
  { grade: GradeLevel; stage: StageId; title: string; focus: string }
> = {
  9: {
    grade: 9,
    stage: "basic",
    title: "Grade 9",
    focus: "Strengthen core skills in Arabic, English, maths and separated sciences.",
  },
  10: {
    grade: 10,
    stage: "basic",
    title: "Grade 10",
    focus: "Consolidate basics and prepare subject choices for the GED years.",
  },
  11: {
    grade: 11,
    stage: "ged",
    title: "Grade 11",
    focus: "Start the diploma: continuous assessment across core and elective subjects.",
  },
  12: {
    grade: 12,
    stage: "ged",
    title: "Grade 12",
    focus: "External MoE semester exams and university / scholarship readiness.",
  },
};

function uniqueTopics(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const t of list) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
  }
  return out;
}

const mathByGrade: Record<GradeLevel, string[]> = {
  9: [
    "Number systems & place value",
    "Algebraic expressions",
    "Linear equations & inequalities",
    "Angles, polygons & circles",
    "Perimeter, area & volume",
    "Ratio, proportion & percentages",
    "Data handling & averages",
    "Coordinate graphs intro",
  ],
  10: [
    "Quadratic expressions",
    "Simultaneous equations",
    "Pythagoras theorem",
    "Trigonometry of right triangles",
    "Coordinate geometry",
    "Sequences & patterns",
    "Probability basics",
    "Transformations of shapes",
  ],
  11: [
    "Functions & graphs",
    "Quadratic equations",
    "Geometry & mensuration",
    "Trigonometry",
    "Statistics & probability",
    "Linear equations (review)",
  ],
  12: [
    "Advanced algebra",
    "Rates of change & calculus intro",
    "Advanced trigonometry",
    "Vectors & geometry",
    "Statistical reasoning",
    "Exam-style problem solving",
  ],
};

const physicsByGrade: Record<GradeLevel, string[]> = {
  9: [
    "Forces & motion intro",
    "Speed, distance & time",
    "Energy stores & transfers",
    "Simple machines",
    "Light & shadows",
    "Sound waves",
  ],
  10: [
    "Newton's laws foundations",
    "Pressure & density",
    "Heat & temperature",
    "Electric circuits basics",
    "Magnetism intro",
    "Waves properties",
  ],
  11: [
    "Newton's laws",
    "Work, energy & power",
    "Waves & sound",
    "Electricity basics",
    "Optics",
    "Motion in 1D/2D",
  ],
  12: [
    "Mechanics applications",
    "Electromagnetism",
    "Circular motion & gravity",
    "Modern physics intro",
    "Experimental skills & graphs",
    "Past-paper problem solving",
  ],
};

const chemistryByGrade: Record<GradeLevel, string[]> = {
  9: [
    "States of matter",
    "Elements, compounds & mixtures",
    "Atomic model intro",
    "Physical & chemical changes",
    "Acids & bases intro",
    "Lab safety & apparatus",
  ],
  10: [
    "Periodic table basics",
    "Chemical formulae",
    "Types of reactions",
    "Acids, bases & salts",
    "Metals & reactivity",
    "Separation techniques",
  ],
  11: [
    "Atomic structure",
    "Periodic table trends",
    "Chemical bonding",
    "Acids, bases & salts",
    "Stoichiometry",
    "Organic nomenclature intro",
  ],
  12: [
    "Organic chemistry",
    "Equilibrium & rates",
    "Electrochemistry",
    "Energetics",
    "Analytical techniques",
    "Practical investigations",
  ],
};

const biologyByGrade: Record<GradeLevel, string[]> = {
  9: [
    "Cell structure basics",
    "Organisation of living things",
    "Nutrition in plants & animals",
    "Human digestive system intro",
    "Ecosystems & habitats",
    "Classification",
  ],
  10: [
    "Respiration",
    "Circulation & transport",
    "Reproduction basics",
    "Microorganisms & disease",
    "Photosynthesis",
    "Human impact on environment",
  ],
  11: [
    "Cell structure",
    "Cell division",
    "Genetics basics",
    "Human digestive system",
    "Ecology & environment",
    "Photosynthesis",
  ],
  12: [
    "Inheritance & variation",
    "Homeostasis",
    "Nervous & hormonal control",
    "Biotechnology intro",
    "Biodiversity & conservation",
    "Experimental biology skills",
  ],
};

const englishByGrade: Record<GradeLevel, string[]> = {
  9: [
    "Reading for gist & detail",
    "Paragraph writing",
    "Present & past tenses",
    "Vocabulary in context",
    "Listening & speaking practice",
    "Informal messages",
  ],
  10: [
    "Reading comprehension",
    "Descriptive & narrative writing",
    "Grammar accuracy",
    "Academic vocabulary",
    "Summary skills",
    "Formal emails",
  ],
  11: [
    "Reading comprehension",
    "Essay structure",
    "Grammar essentials",
    "Vocabulary building",
    "Summary writing",
    "Letter & email writing",
  ],
  12: [
    "Critical reading",
    "Argumentative essays",
    "Advanced grammar",
    "Exam listening strategies",
    "Report writing",
    "Oral presentation skills",
  ],
};

const arabicByGrade: Record<GradeLevel, string[]> = {
  9: [
    "القراءة والفهم",
    "الإملاء والترقيم",
    "النحو الأساسي",
    "التعبير الكتابي",
    "النصوص الأدبية",
    "المهارات الشفهية",
  ],
  10: [
    "تحليل النصوص",
    "البلاغة المبسطة",
    "قواعد النحو والصرف",
    "الكتابة الوظيفية",
    "المطالعة الحرة",
    "الاستماع والتحدث",
  ],
  11: [
    "المؤنس: الأدب والنصوص",
    "المفيد: القواعد والتدريبات",
    "البلاغة والنقد",
    "التعبير والإنشاء",
    "فهم المقروء",
    "الإملاء المتقدم",
  ],
  12: [
    "تحليل النصوص الأدبية",
    "البلاغة التطبيقية",
    "النحو والصرف المتقدم",
    "الكتابة الأكاديمية",
    "المطالعة والنقد",
    "التحضير للامتحان الوزاري",
  ],
};

const islamicByGrade: Record<GradeLevel, string[]> = {
  9: [
    "العقيدة وأدلة الإيمان",
    "فقه العبادات",
    "السيرة النبوية",
    "الأخلاق الإسلامية",
    "حفظ وفهم الآيات",
    "السلوك والقيم",
  ],
  10: [
    "أصول الإيمان",
    "فقه المعاملات المبسطة",
    "قصص الأنبياء",
    "التهذيب والسلوك",
    "التلاوة والتجويد",
    "المسؤولية الاجتماعية",
  ],
  11: [
    "العقيدة الإسلامية",
    "الفقه وأحكامه",
    "الحديث الشريف",
    "التربية والقيم",
    "التلاوة والتفسير",
    "القضايا المعاصرة",
  ],
  12: [
    "أصول الدين",
    "الفقه المقارن المبسط",
    "السيرة والحضارة",
    "الأخلاق والعمل",
    "التفسير الموضوعي",
    "التحضير للامتحان الوزاري",
  ],
};

const socialByGrade: Record<GradeLevel, string[]> = {
  9: [
    "جغرافية سلطنة عمان",
    "المناخ والتضاريس",
    "السكان والمجتمع",
    "التراث العماني",
    "المواطنة",
    "الوطن العربي نظرة عامة",
  ],
  10: [
    "التاريخ العماني الحديث",
    "الموارد الاقتصادية",
    "التنمية في عمان",
    "الخرائط والمهارات",
    "الخليج العربي",
    "البيئة والاستدامة",
  ],
  11: [
    "هذا وطني",
    "الحضارة الإسلامية",
    "الجغرافيا الاقتصادية",
    "المواطنة والهوية",
    "الموارد والطاقة",
    "المهارات البحثية",
  ],
  12: [
    "هذا وطني (متقدم)",
    "العالم من حولي",
    "الجغرافيا والتقنيات الحديثة",
    "القضايا الإقليمية",
    "التنمية المستدامة",
    "التحضير للامتحان الوزاري",
  ],
};

const ictByGrade: Record<GradeLevel, string[]> = {
  9: [
    "Computer fundamentals",
    "File management",
    "Word processing",
    "Spreadsheets intro",
    "Internet safety",
    "Presentations",
  ],
  10: [
    "Digital citizenship",
    "Spreadsheets & charts",
    "Databases intro",
    "Multimedia basics",
    "Networks overview",
    "Problem-solving with ICT",
  ],
  11: [
    "ICT systems",
    "Data & information",
    "Programming foundations",
    "Web basics",
    "Cybersecurity awareness",
    "Digital projects",
  ],
  12: [
    "Advanced ICT applications",
    "Data analysis skills",
    "Algorithms & logic",
    "Digital entrepreneurship",
    "Project documentation",
    "Exam practical tasks",
  ],
};

export const SUBJECT_CATALOG: SubjectDef[] = [
  {
    id: "math",
    name: "Mathematics",
    nameAr: "الرياضيات",
    icon: Calculator,
    color: "indigo",
    description:
      "Number, algebra, geometry and statistics — Basic (9–10) through GED Basic/Advanced tracks (11–12).",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: mathByGrade,
    topics: uniqueTopics(
      mathByGrade[9],
      mathByGrade[10],
      mathByGrade[11],
      mathByGrade[12]
    ),
  },
  {
    id: "physics",
    name: "Physics",
    nameAr: "الفيزياء",
    icon: Atom,
    color: "blue",
    description:
      "Forces, energy, waves and electricity aligned with Oman MoE science books.",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: physicsByGrade,
    topics: uniqueTopics(
      physicsByGrade[9],
      physicsByGrade[10],
      physicsByGrade[11],
      physicsByGrade[12]
    ),
  },
  {
    id: "chemistry",
    name: "Chemistry",
    nameAr: "الكيمياء",
    icon: FlaskConical,
    color: "emerald",
    description:
      "Matter, reactions, bonding and organic chemistry with lab-style practice.",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: chemistryByGrade,
    topics: uniqueTopics(
      chemistryByGrade[9],
      chemistryByGrade[10],
      chemistryByGrade[11],
      chemistryByGrade[12]
    ),
  },
  {
    id: "biology",
    name: "Biology",
    nameAr: "الأحياء",
    icon: Dna,
    color: "rose",
    description:
      "Cells, human systems, genetics and ecology from Basic Education into the diploma.",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: biologyByGrade,
    topics: uniqueTopics(
      biologyByGrade[9],
      biologyByGrade[10],
      biologyByGrade[11],
      biologyByGrade[12]
    ),
  },
  {
    id: "english",
    name: "English",
    nameAr: "اللغة الإنجليزية",
    icon: Languages,
    color: "amber",
    description:
      "Engage with English pathway — reading, writing, grammar and exam skills.",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: englishByGrade,
    topics: uniqueTopics(
      englishByGrade[9],
      englishByGrade[10],
      englishByGrade[11],
      englishByGrade[12]
    ),
  },
  {
    id: "arabic",
    name: "Arabic",
    nameAr: "اللغة العربية",
    icon: BookOpen,
    color: "violet",
    description:
      "لغتي الجميلة then المؤنس والمفيد — reading, grammar, rhetoric and writing.",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: arabicByGrade,
    topics: uniqueTopics(
      arabicByGrade[9],
      arabicByGrade[10],
      arabicByGrade[11],
      arabicByGrade[12]
    ),
  },
  {
    id: "islamic",
    name: "Islamic Studies",
    nameAr: "التربية الإسلامية",
    icon: Moon,
    color: "teal",
    description:
      "Aqeedah, fiqh, seerah and values across Basic Education and the GED.",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: islamicByGrade,
    topics: uniqueTopics(
      islamicByGrade[9],
      islamicByGrade[10],
      islamicByGrade[11],
      islamicByGrade[12]
    ),
  },
  {
    id: "social",
    name: "Social Studies",
    nameAr: "الدراسات الاجتماعية",
    icon: Globe2,
    color: "cyan",
    description:
      "Omani geography, history, هذا وطني, civilization and economic geography.",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: socialByGrade,
    topics: uniqueTopics(
      socialByGrade[9],
      socialByGrade[10],
      socialByGrade[11],
      socialByGrade[12]
    ),
  },
  {
    id: "ict",
    name: "ICT",
    nameAr: "تقنية المعلومات",
    icon: Monitor,
    color: "blue",
    description:
      "Digital skills, productivity tools and ICT systems for MoE classes.",
    stages: ["basic", "ged"],
    grades: [9, 10, 11, 12],
    topicsByGrade: ictByGrade,
    topics: uniqueTopics(
      ictByGrade[9],
      ictByGrade[10],
      ictByGrade[11],
      ictByGrade[12]
    ),
  },
];

export function getSubject(id: string): SubjectDef | undefined {
  return SUBJECT_CATALOG.find((s) => s.id === id);
}

export function getTopicsForGrade(
  subject: SubjectDef,
  grade: GradeLevel
): string[] {
  return subject.topicsByGrade[grade] ?? [];
}

export function getSubjectsForGrade(grade: GradeLevel): SubjectDef[] {
  return SUBJECT_CATALOG.filter((s) => s.grades.includes(grade));
}

export function getSubjectsForStage(stage: StageId): SubjectDef[] {
  return SUBJECT_CATALOG.filter((s) => s.stages.includes(stage));
}

export function formatGrades(grades: GradeLevel[]): string {
  if (grades.length === 4) return "Grades 9–12";
  if (grades.length === 2 && grades[0] === 9 && grades[1] === 10) {
    return "Grades 9–10";
  }
  if (grades.length === 2 && grades[0] === 11 && grades[1] === 12) {
    return "Grades 11–12";
  }
  return `Grade ${grades.join(", ")}`;
}
