import type {

  LearningLanguage,

  PracticeQuestion,

  TopicLesson,

} from "./types";

import {

  ARABIC_PRIMARY_SUBJECT_IDS,

  STEM_SUBJECT_IDS,

} from "./types";



export type ResolvedPractice = {

  id: string;

  prompt: string;

  choices: string[];

  correctIndex: number;

  explanation: string;

  /** True when Arabic fields were requested but missing */

  usedFallback: boolean;

};



export type ResolvedLessonView = {

  topicTitle: string;

  topicSubtitle: string | null;

  summary: string;

  objectives: string[];

  keyPoints: string[];

  practice: ResolvedPractice[];

  /** Arabic short explanation panel (Mixed STEM) */

  arabicBrief: {

    summary: string;

    objectives: string[];

    keyPoints: string[];

  } | null;

  /** English gloss panel (Mixed Arabic-primary) */

  englishGloss: {

    summary: string;

    keyPoints: string[];

  } | null;

  missingNotice: string | null;

  showGlossary: boolean;

  dir: "ltr" | "rtl" | "auto";

};



function pickString(

  primary: string | undefined,

  fallback: string,

  preferPrimary: boolean

): { text: string; usedFallback: boolean } {

  if (preferPrimary) {

    if (primary?.trim()) return { text: primary, usedFallback: false };

    return { text: fallback, usedFallback: true };

  }

  return { text: fallback, usedFallback: false };

}



function pickList(

  primary: string[] | undefined,

  fallback: string[],

  preferPrimary: boolean

): { list: string[]; usedFallback: boolean } {

  if (preferPrimary) {

    if (primary && primary.length > 0) return { list: primary, usedFallback: false };

    return { list: fallback, usedFallback: true };

  }

  return { list: fallback, usedFallback: false };

}



function resolvePractice(

  q: PracticeQuestion,

  mode: LearningLanguage,

  subjectId: string

): ResolvedPractice {

  const stem = STEM_SUBJECT_IDS.has(subjectId);

  const arabicPrimary = ARABIC_PRIMARY_SUBJECT_IDS.has(subjectId);



  if (mode === "en") {

    return {

      id: q.id,

      prompt: q.prompt,

      choices: q.choices,

      correctIndex: q.correctIndex,

      explanation: q.explanation,

      usedFallback: false,

    };

  }



  if (mode === "ar") {

    const prompt = q.promptAr?.trim() ? q.promptAr : q.prompt;

    const choices =

      q.choicesAr && q.choicesAr.length === q.choices.length

        ? q.choicesAr

        : q.choices;

    const explanation = q.explanationAr?.trim()

      ? q.explanationAr

      : q.explanation;

    return {

      id: q.id,

      prompt,

      choices,

      correctIndex: q.correctIndex,

      explanation,

      usedFallback:

        !q.promptAr?.trim() ||

        !q.choicesAr ||

        q.choicesAr.length !== q.choices.length ||

        !q.explanationAr?.trim(),

    };

  }



  // Mixed: STEM keeps EN quiz (classroom terms); Arabic-primary prefers AR

  if (arabicPrimary && q.promptAr) {

    return {

      id: q.id,

      prompt: q.promptAr,

      choices:

        q.choicesAr && q.choicesAr.length === q.choices.length

          ? q.choicesAr

          : q.choices,

      correctIndex: q.correctIndex,

      explanation: q.explanationAr || q.explanation,

      usedFallback: false,

    };

  }



  if (stem) {

    return {

      id: q.id,

      prompt: q.prompt,

      choices: q.choices,

      correctIndex: q.correctIndex,

      explanation: q.explanation,

      usedFallback: false,

    };

  }



  return {

    id: q.id,

    prompt: q.prompt,

    choices: q.choices,

    correctIndex: q.correctIndex,

    explanation: q.explanation,

    usedFallback: false,

  };

}



/**

 * Resolve lesson notes/quiz copy for the active learning language.

 * Degrades gracefully when Arabic (or English) fields are missing.

 */

export function resolveLessonView(

  lesson: TopicLesson,

  language: LearningLanguage

): ResolvedLessonView {

  const stem = STEM_SUBJECT_IDS.has(lesson.subjectId);

  const arabicPrimary = ARABIC_PRIMARY_SUBJECT_IDS.has(lesson.subjectId);

  let anyFallback = false;



  if (language === "en") {

    return {

      topicTitle: lesson.topic,

      topicSubtitle: lesson.topicAr ?? null,

      summary: lesson.summary,

      objectives: lesson.objectives,

      keyPoints: lesson.keyPoints,

      practice: lesson.practice.map((q) => resolvePractice(q, "en", lesson.subjectId)),

      arabicBrief: null,

      englishGloss: null,

      missingNotice: null,

      showGlossary: stem && (lesson.glossary?.length ?? 0) > 0,

      dir: "ltr",

    };

  }



  if (language === "ar") {

    const topic = pickString(lesson.topicAr, lesson.topic, true);

    const summary = pickString(lesson.summaryAr, lesson.summary, true);

    const objectives = pickList(lesson.objectivesAr, lesson.objectives, true);

    const keyPoints = pickList(lesson.keyPointsAr, lesson.keyPoints, true);

    anyFallback =

      topic.usedFallback ||

      summary.usedFallback ||

      objectives.usedFallback ||

      keyPoints.usedFallback;



    const practice = lesson.practice.map((q) =>

      resolvePractice(q, "ar", lesson.subjectId)

    );

    if (practice.some((p) => p.usedFallback)) anyFallback = true;



    return {

      topicTitle: topic.text,

      topicSubtitle: topic.usedFallback ? null : lesson.topic,

      summary: summary.text,

      objectives: objectives.list,

      keyPoints: keyPoints.list,

      practice,

      arabicBrief: null,

      englishGloss: null,

      missingNotice: anyFallback

        ? "بعض المحتوى غير مترجم بعد — نعرض النص الإنجليزي مؤقتاً."

        : null,

      showGlossary: stem && (lesson.glossary?.length ?? 0) > 0,

      dir: "rtl",

    };

  }



  // Mixed

  if (stem) {

    const hasAr =

      !!lesson.summaryAr ||

      (lesson.keyPointsAr && lesson.keyPointsAr.length > 0);



    return {

      topicTitle: lesson.topic,

      topicSubtitle: lesson.topicAr ?? null,

      summary: lesson.summary,

      objectives: lesson.objectives,

      keyPoints: lesson.keyPoints,

      practice: lesson.practice.map((q) =>

        resolvePractice(q, "mixed", lesson.subjectId)

      ),

      arabicBrief: hasAr

        ? {

            summary: lesson.summaryAr || lesson.summary,

            objectives: lesson.objectivesAr?.length

              ? lesson.objectivesAr

              : lesson.objectives,

            keyPoints: lesson.keyPointsAr?.length

              ? lesson.keyPointsAr

              : lesson.keyPoints,

          }

        : null,

      englishGloss: null,

      missingNotice: hasAr

        ? null

        : "شرح عربي مختصر غير متوفر بعد لهذا الموضوع.",

      showGlossary: (lesson.glossary?.length ?? 0) > 0,

      dir: "ltr",

    };

  }



  if (arabicPrimary) {

    const summary = pickString(lesson.summaryAr, lesson.summary, true);

    const keyPoints = pickList(lesson.keyPointsAr, lesson.keyPoints, true);

    const topic = pickString(lesson.topicAr, lesson.topic, true);

    const objectives = pickList(lesson.objectivesAr, lesson.objectives, true);



    return {

      topicTitle: topic.text,

      topicSubtitle: lesson.topic,

      summary: summary.text,

      objectives: objectives.list,

      keyPoints: keyPoints.list,

      practice: lesson.practice.map((q) =>

        resolvePractice(q, "mixed", lesson.subjectId)

      ),

      arabicBrief: null,

      englishGloss: {

        summary: lesson.summary,

        keyPoints: lesson.keyPoints.slice(0, 3),

      },

      missingNotice: null,

      showGlossary: (lesson.glossary?.length ?? 0) > 0,

      dir: "rtl",

    };

  }



  // English / other: Mixed ≈ English body + optional Arabic brief

  return {

    topicTitle: lesson.topic,

    topicSubtitle: lesson.topicAr ?? null,

    summary: lesson.summary,

    objectives: lesson.objectives,

    keyPoints: lesson.keyPoints,

    practice: lesson.practice.map((q) =>

      resolvePractice(q, "mixed", lesson.subjectId)

    ),

    arabicBrief: lesson.summaryAr

      ? {

          summary: lesson.summaryAr,

          objectives: lesson.objectivesAr || lesson.objectives,

          keyPoints: lesson.keyPointsAr || lesson.keyPoints,

        }

      : null,

    englishGloss: null,

    missingNotice: null,

    showGlossary: (lesson.glossary?.length ?? 0) > 0,

    dir: "ltr",

  };

}



/** True when lesson has Arabic notes + at least one bilingual practice item */

export function isFullyBilingual(lesson: TopicLesson): boolean {

  if (!lesson.summaryAr?.trim()) return false;

  if (!lesson.keyPointsAr || lesson.keyPointsAr.length === 0) return false;

  if (!lesson.objectivesAr || lesson.objectivesAr.length === 0) return false;

  const bilingualQs = lesson.practice.filter(

    (q) =>

      q.promptAr?.trim() &&

      q.choicesAr &&

      q.choicesAr.length === q.choices.length &&

      q.explanationAr?.trim()

  );

  return bilingualQs.length === lesson.practice.length && lesson.practice.length > 0;

}



export function defaultLearningLanguageForSubject(

  subjectId: string

): LearningLanguage {

  if (ARABIC_PRIMARY_SUBJECT_IDS.has(subjectId)) return "ar";

  if (STEM_SUBJECT_IDS.has(subjectId)) return "mixed";

  return "en";

}



/**

 * Language instruction for the AI tutor (independent of RAG retrieval).

 */

export function tutorLanguageInstruction(

  language: LearningLanguage,

  subjectId?: string

): string {

  const stem = subjectId ? STEM_SUBJECT_IDS.has(subjectId) : true;

  const arabicPrimary = subjectId

    ? ARABIC_PRIMARY_SUBJECT_IDS.has(subjectId)

    : false;



  if (language === "en") {

    return "Answer entirely in clear English.";

  }

  if (language === "ar") {

    return "أجب بالعربية الفصحى الواضحة المناسبة لطلاب السلطنة. أبقِ المصطلحات العلمية/الرياضية الإنجليزية بين قوسين عند الحاجة (مثل inequality / متباينة).";

  }

  // Mixed

  if (arabicPrimary) {

    return "اشرح بالعربية أولاً، وأضف مقابلاً إنجليزياً موجزاً للمصطلحات الأساسية بين قوسين.";

  }

  if (stem) {

    return "Explain in Arabic (شرح) while keeping English technical terms (equation, force, inequality, etc.). Omani classroom style: English STEM terms + Arabic explanation.";

  }

  return "Use Mixed mode: clear English with Arabic clarifications for key terms when helpful.";

}



export function tutorFallbackMessage(

  language: LearningLanguage

): string {

  if (language === "ar") {

    return "لم أجد هذا في كتبك أو مكتبة وزارة التربية. فعّل المكتبة المشتركة، ارفع PDF، أو اطرح سؤالاً عاماً.";

  }

  if (language === "mixed") {

    return "لم أجد هذا في كتبك أو مكتبة MoE / I couldn’t find this in your books or the MoE library. Turn on the shared library, upload a PDF, or ask a general question.";

  }

  return "I couldn’t find this in your books or the shared MoE library. Turn on the MoE library, upload a PDF, or ask a general question.";

}


