import {
  BookOpen,
  Upload,
  Languages,
  ClipboardCheck,
  Calendar,
  BarChart3,
  Zap,
  Shield,
  Sparkles,
  School,
  GraduationCap,
} from "lucide-react";

/** Landing-page marketing content only — app dashboard uses live user data. */

export type ProofFeature = {
  icon: typeof Upload;
  title: string;
  description: string;
  href: string;
  cta: string;
  color: string;
  bg: string;
};

/** Four proof pillars with real in-app routes (not generic “AI study” fluff). */
export const proofFeatures: ProofFeature[] = [
  {
    icon: Upload,
    title: "Answers from your textbooks",
    description:
      "Shared Oman MoE corpus plus your uploads. The tutor cites real pages — not generic web knowledge.",
    href: "/library",
    cta: "Open Library",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: ClipboardCheck,
    title: "Exam OS and readiness",
    description:
      "Topic drills, mixed papers, and timed mocks for Grades 9–12. Readiness from mastery, accuracy, coverage, and recency.",
    href: "/exams",
    cta: "Open Exam OS",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BookOpen,
    title: "MoE pathway lessons",
    description:
      "Basic Education into the General Education Diploma. Each topic opens a lesson with video, notes, and a quiz.",
    href: "/subjects",
    cta: "Browse Subjects",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: School,
    title: "Teacher class assignments",
    description:
      "Teachers create classes with join codes. Students get assigned drills. Progress syncs. Chat stays private.",
    href: "/classes",
    cta: "Join a class",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

/** @deprecated Prefer proofFeatures — kept for any leftover imports. */
export const features = proofFeatures.map(({ href: _h, cta: _c, ...rest }) => rest);

/** Product proofs — not fabricated score testimonials. */
export const featureProofs = [
  {
    title: "Textbook-grounded tutor",
    body: "Ask a question → get an answer with MoE library or upload citations (title + page range).",
    href: "/tutor",
    routeLabel: "/tutor",
  },
  {
    title: "Exam readiness score",
    body: "Built from topic mastery, 7-day exam accuracy, grade coverage, and how recently you studied — not a vibes meter.",
    href: "/exams",
    routeLabel: "/exams",
  },
  {
    title: "EN / ع classroom language",
    body: "Toggle English, العربية, or Mixed (STEM terms in EN + Arabic شرح) across lessons and tutor.",
    href: "/subjects",
    routeLabel: "/subjects",
  },
];

/** Legacy shape — unused on landing after redesign; empty to avoid fake quotes. */
export const testimonials: {
  quote: string;
  name: string;
  school: string;
  subject: string;
  avatar: string;
}[] = [];

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/exams", label: "Exam OS", icon: ClipboardCheck },
  { href: "/library", label: "Library", icon: Upload },
  { href: "/tutor", label: "AI Tutor", icon: Sparkles },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/classes", label: "Classes", icon: School },
];

export const trustBadges = [
  { icon: Shield, label: "Oman MoE Grades 9–12" },
  { icon: GraduationCap, label: "Textbook citations" },
  { icon: Languages, label: "EN / ع bilingual" },
  { icon: Zap, label: "Exam readiness" },
];

export const comparisonPoints = {
  headline: "General content is useful. MoE exams need more.",
  khan: [
    "World-class general video library",
    "Broad K–12 topics worldwide",
    "Not tied to Oman MoE textbooks",
  ],
  us: [
    "Grounded in Oman MoE PDFs and your uploads",
    "Exam OS for Grades 9–12 readiness",
    "Bilingual EN/ع and teacher assignments",
  ],
};
