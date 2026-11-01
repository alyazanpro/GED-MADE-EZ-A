# Bilingual lessons (Oman classroom pattern)

GED MADE EZ supports **English | العربية | Mixed** learning language.

## Classroom model

| Subject type | Default feel in Mixed |
|---|---|
| STEM (math, physics, chemistry, biology, ICT) | English notes + Arabic **شرح مختصر** + EN↔AR glossary |
| Arabic / Islamic / Social | Arabic-first + English gloss for key terms |
| English | English body; optional Arabic brief if present |

YouTube videos stay as curated; we do **not** mass machine-translate the catalogue.

## Schema (`TopicLesson`)

Optional bilingual fields in `src/data/lessons/types.ts`:

- `topicAr`
- `summaryAr`
- `objectivesAr` / `keyPointsAr`
- `glossary: { en, ar }[]`
- Practice: `promptAr`, `choicesAr`, `explanationAr`

English fields remain required so missing Arabic degrades gracefully.

## How to add a bilingual lesson

1. **Prefer a dedicated pack** (keeps quality reviews small):
   - Math G9: `src/data/lessons/math-g9-lessons.ts`
   - Physics core: `src/data/lessons/physics-core-bilingual.ts`
2. Fill **all** of: `summaryAr`, `objectivesAr`, `keyPointsAr`, glossary (STEM), and every practice `*Ar` field.
3. Register the pack in `src/data/lessons/index.ts` via `mergeLessons(...)` **last** so it overrides the English-only entry.
4. Open Subjects → topic should show badge **EN / ع** when `isFullyBilingual(lesson)` is true.
5. Toggle Mixed / ع / EN on a lesson and confirm notes + quiz update.

### Minimal example

```ts
{
  subjectId: "math",
  topic: "Linear equations & inequalities",
  topicAr: "المعادلات والمتباينات الخطية",
  summary: "...",
  summaryAr: "...",
  objectives: ["..."],
  objectivesAr: ["..."],
  keyPoints: ["..."],
  keyPointsAr: ["..."],
  glossary: [{ en: "inequality", ar: "متباينة" }],
  videos: [/* keep verified YouTube IDs */],
  practice: [{
    id: "lei-2",
    prompt: "Solve: −2x > 8",
    promptAr: "حل: −2x > 8",
    choices: ["x > −4", "x < −4", "x > 4", "x < 4"],
    choicesAr: ["x > −4", "x < −4", "x > 4", "x < 4"],
    correctIndex: 1,
    explanation: "Divide by −2 and flip the sign: x < −4.",
    explanationAr: "اقسم على −2 واعكس الإشارة: x < −4.",
  }],
}
```

## User preference

- Stored on `UserLearningData.learningLanguage` (`en` | `ar` | `mixed`)
- Schema `version: 2` — `loadUserData` migrates older saves (default **mixed**)
- Toggle: app sidebar + lesson header + tutor header

## Tutor

Language preference is **independent of RAG retrieval**. Citations still come from uploaded MoE PDFs; the answer language follows the preference (Mixed STEM ≈ Arabic شرح with English technical terms).

## Priority content (shipped)

- **All Math Grade 9** topics (8) — fully bilingual
- **Physics core**: Forces & motion, Speed/distance/time, Newton foundations, Electric circuits basics

Do not bulk-MT the remaining ~200 topics; extend pack-by-pack with glossary + real classroom Arabic.
