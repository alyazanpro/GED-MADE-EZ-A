import type { ExamQuestion } from "./types";

export const ENGLISH_EXAM: ExamQuestion[] = [
  // ── Grade 9 (basic) ──────────────────────────────────────────────
  {
    id: "e9-rg-01",
    subjectId: "english",
    topic: "Reading for gist & detail",
    grade: 9,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Read the notice: “The school library will be closed from Sunday to Tuesday for stock-taking. Students may borrow books again from Wednesday morning.” What is the main message? [1 mark]",
    choices: [
      "The library is permanently closed.",
      "The library is closed for three days and reopens on Wednesday.",
      "Students must return all books on Sunday.",
      "Stock-taking happens every Wednesday.",
    ],
    correctAnswer: "1",
    explanation:
      "The notice states a temporary closure (Sunday–Tuesday) and that borrowing resumes Wednesday morning; that is the gist.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e9-rg-02",
    subjectId: "english",
    topic: "Reading for gist & detail",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "In a short article, the writer says: “Although the weather was cloudy, the football match went ahead as planned.” According to the text, which detail is true? [1 mark]",
    choices: [
      "The match was cancelled because of clouds.",
      "The match was delayed until the sun came out.",
      "The match took place despite cloudy weather.",
      "The players refused to play in cloudy weather.",
    ],
    correctAnswer: "2",
    explanation:
      "“Went ahead as planned” means the match took place; “although … cloudy” shows contrast, not cancellation.",
    marks: 1,
    tags: ["exam-style"],
    promptAr:
      "في مقال قصير يقول الكاتب: «على الرغم من أن الطقس كان غائماً، أقيمت مباراة كرة القدم كما خُطط لها.» أي تفصيل صحيح بحسب النص؟ [درجة واحدة]",
    explanationAr:
      "عبارة «أقيمت كما خُطط لها» تعني أن المباراة جرت فعلاً؛ و«على الرغم من الغيوم» تدل على التباين لا على الإلغاء.",
  },
  {
    id: "e9-pw-01",
    subjectId: "english",
    topic: "Paragraph writing",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "structured",
    prompt:
      "Write one paragraph (80–100 words) describing your favourite place in your town or village. Include a topic sentence, two supporting details, and a concluding sentence. [6 marks]",
    correctAnswer:
      "Clear topic sentence naming the place; 2+ concrete details (sights, sounds, feelings); concluding sentence; mostly accurate grammar; ~80–100 words",
    rubricNotes:
      "Award marks for: topic sentence (1), relevant supporting detail (2), conclusion (1), organisation & cohesion (1), language accuracy (1).",
    explanation:
      "A well-organised paragraph needs a controlling idea, supporting sentences that develop it, and a brief closing idea that does not introduce a new topic.",
    marks: 6,
    tags: ["exam-style"],
  },
  {
    id: "e9-pw-02",
    subjectId: "english",
    topic: "Paragraph writing",
    grade: 9,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Which sentence is the best topic sentence for a paragraph about healthy school lunches? [1 mark]",
    choices: [
      "My brother likes pizza.",
      "Healthy school lunches help students stay focused and energetic during the day.",
      "Then we washed the dishes carefully.",
      "In conclusion, sport is important.",
    ],
    correctAnswer: "1",
    explanation:
      "A topic sentence introduces the main idea of the paragraph; option B clearly states the controlling idea about healthy school lunches.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e9-tp-01",
    subjectId: "english",
    topic: "Present & past tenses",
    grade: 9,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Choose the correct verb form: “Yesterday, Fatima ______ her homework before dinner.” [1 mark]",
    choices: ["finish", "finishes", "finished", "finishing"],
    correctAnswer: "2",
    explanation:
      "“Yesterday” signals a completed past action, so the simple past “finished” is required.",
    marks: 1,
    tags: ["exam-style"],
    explanationAr:
      "كلمة «Yesterday» تدل على فعل مكتمل في الماضي، لذا يُستخدم الماضي البسيط finished.",
  },
  {
    id: "e9-tp-02",
    subjectId: "english",
    topic: "Present & past tenses",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "short",
    prompt:
      "Rewrite the sentence in the present simple: “They played football every Friday.” [1 mark]",
    correctAnswer:
      "They play football every Friday.|they play football every friday",
    explanation:
      "Habits and regular routines use the present simple: play (not played).",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e9-vc-01",
    subjectId: "english",
    topic: "Vocabulary in context",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "In the sentence “The teacher asked us to revise our notes before the quiz,” the word revise is closest in meaning to: [1 mark]",
    choices: ["throw away", "review and study again", "translate into Arabic", "copy from a friend"],
    correctAnswer: "1",
    explanation:
      "In school contexts, revise means to go over material again in preparation for a test.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e9-im-01",
    subjectId: "english",
    topic: "Informal messages",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "structured",
    prompt:
      "Your friend has invited you to a weekend picnic, but you cannot go. Write a short informal message (40–60 words) to apologise, give a brief reason, and suggest another time to meet. [5 marks]",
    correctAnswer:
      "Friendly greeting; clear apology; short reason; alternative suggestion; informal closing; ~40–60 words",
    rubricNotes:
      "Content (apology + reason + suggestion) 3; tone & informal style 1; language accuracy 1.",
    explanation:
      "Informal messages should sound friendly, cover the required points, and avoid formal letter conventions such as “Yours faithfully”.",
    marks: 5,
    tags: ["exam-style"],
    promptAr:
      "دعاك صديقك إلى نزهة في عطلة نهاية الأسبوع لكنك لا تستطيع الذهاب. اكتب رسالة غير رسمية قصيرة (٤٠–٦٠ كلمة) للاعتذار مع ذكر سبب موجز واقتراح وقت آخر للقاء. [٥ درجات]",
  },

  // ── Grade 10 (basic) ─────────────────────────────────────────────
  {
    id: "e10-rc-01",
    subjectId: "english",
    topic: "Reading comprehension",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "A passage states: “Many students prefer studying in the morning because they feel more alert after a good night’s sleep.” What can be inferred? [2 marks]",
    choices: [
      "Night study is always more effective.",
      "Alertness after sleep may help morning study.",
      "Students never sleep well.",
      "Teachers ban evening homework.",
    ],
    correctAnswer: "1",
    explanation:
      "The text links morning preference to feeling alert after sleep; the reasonable inference is that alertness supports morning study.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "e10-rc-02",
    subjectId: "english",
    topic: "Reading comprehension",
    grade: 10,
    stage: "basic",
    difficulty: "hard",
    type: "short",
    prompt:
      "A text describes a coastal village that depends on fishing and tourism. In one sentence, state the writer’s main purpose. [2 marks]",
    correctAnswer:
      "to describe/explain how the village depends on fishing and tourism|to show the importance of fishing and tourism to the village",
    explanation:
      "Purpose questions ask why the writer wrote the text; here the focus is explaining the village’s economic dependence on fishing and tourism.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "e10-dn-01",
    subjectId: "english",
    topic: "Descriptive & narrative writing",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "structured",
    prompt:
      "Write a short narrative (120–150 words) beginning with: “When I opened the classroom door, I could not believe what I saw.” Use past tenses and include a clear beginning, middle, and ending. [8 marks]",
    correctAnswer:
      "Opening hook used; coherent plot (beginning–middle–end); past narrative tenses; sensory/descriptive detail; suitable ending; ~120–150 words",
    rubricNotes:
      "Content & plot 3; description 2; organisation 1; range & accuracy of language 2.",
    explanation:
      "Narrative writing needs a sequence of events in the past, enough detail to create atmosphere, and a satisfying close.",
    marks: 8,
    tags: ["exam-style"],
  },
  {
    id: "e10-dn-02",
    subjectId: "english",
    topic: "Descriptive & narrative writing",
    grade: 10,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Which sentence is most suitable for descriptive writing about a busy market? [1 mark]",
    choices: [
      "Markets exist in many countries.",
      "Spices filled the air with a warm, sharp scent while traders called out prices above the crowd.",
      "I went to the market yesterday.",
      "Buying food is necessary.",
    ],
    correctAnswer: "1",
    explanation:
      "Descriptive writing uses sensory detail and vivid language; option B engages smell and sound to create a scene.",
    marks: 1,
    tags: ["exam-style"],
    explanationAr:
      "الكتابة الوصفية تعتمد على التفاصيل الحسية واللغة الحية؛ الخيار ب يوظف حاسة الشم والسمع لرسم المشهد.",
  },
  {
    id: "e10-ga-01",
    subjectId: "english",
    topic: "Grammar accuracy",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "Choose the grammatically correct sentence: [1 mark]",
    choices: [
      "She don’t like loud music.",
      "She doesn’t likes loud music.",
      "She doesn’t like loud music.",
      "She not like loud music.",
    ],
    correctAnswer: "2",
    explanation:
      "Third-person singular present negative uses doesn’t + base verb: doesn’t like.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e10-av-01",
    subjectId: "english",
    topic: "Academic vocabulary",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "In an academic essay, which word best replaces the informal phrase “a lot of” in: “There are a lot of reasons for this change”? [1 mark]",
    choices: ["tons of", "heaps of", "numerous", "super many"],
    correctAnswer: "2",
    explanation:
      "Numerous is an appropriate formal/academic alternative to the informal “a lot of”.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e10-ss-01",
    subjectId: "english",
    topic: "Summary skills",
    grade: 10,
    stage: "basic",
    difficulty: "hard",
    type: "structured",
    prompt:
      "A paragraph argues that recycling reduces waste, saves energy, and protects natural resources. In no more than 40 words, write a summary of the main points only. Do not copy whole sentences. [5 marks]",
    correctAnswer:
      "Recycling cuts waste, saves energy, and helps conserve natural resources. (~≤40 words; own wording; no examples/opinions)",
    rubricNotes:
      "Coverage of three points 3; concise own words 1; within word limit / no lifting 1.",
    explanation:
      "A summary keeps only the essential ideas, uses the student’s own words, and stays within the word limit.",
    marks: 5,
    tags: ["exam-style"],
  },
  {
    id: "e10-fe-01",
    subjectId: "english",
    topic: "Formal emails",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "structured",
    prompt:
      "Write a formal email (80–100 words) to your school principal requesting permission to organise a charity book sale. Include a suitable subject line, greeting, purpose, brief plan, and polite closing. [7 marks]",
    correctAnswer:
      "Subject line; formal greeting; clear request; brief plan (what/when/why); polite closing & full name; formal register; ~80–100 words",
    rubricNotes:
      "Layout & formal conventions 2; content completeness 3; tone & accuracy 2.",
    explanation:
      "Formal emails need a clear subject, respectful tone, complete information, and an appropriate closing such as “Yours sincerely”.",
    marks: 7,
    tags: ["exam-style"],
    promptAr:
      "اكتب بريداً إلكترونياً رسمياً (٨٠–١٠٠ كلمة) إلى مدير المدرسة لطلب الإذن بتنظيم بيع كتب خيري. ضمّن سطراً للموضوع وتحية وهدفاً وخطة موجزة وختاماً مهذباً. [٧ درجات]",
  },

  // ── Grade 11 (ged) ───────────────────────────────────────────────
  {
    id: "e11-rc-01",
    subjectId: "english",
    topic: "Reading comprehension",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "A writer claims: “Online learning offers flexibility; however, it demands strong self-discipline.” The writer’s attitude towards online learning is best described as: [2 marks]",
    choices: [
      "entirely negative",
      "balanced / acknowledging both benefit and challenge",
      "humorous and dismissive",
      "unconditionally supportive",
    ],
    correctAnswer: "1",
    explanation:
      "The contrast with “however” presents both an advantage (flexibility) and a requirement (self-discipline), which is a balanced view.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "e11-rc-02",
    subjectId: "english",
    topic: "Reading comprehension",
    grade: 11,
    stage: "ged",
    difficulty: "hard",
    type: "short",
    prompt:
      "Explain in your own words what is meant by “the author’s tone” in a reading passage. [2 marks]",
    correctAnswer:
      "the writer's attitude/feeling toward the subject or audience|how the writer sounds (e.g. serious, critical, optimistic)",
    explanation:
      "Tone refers to the writer’s attitude (serious, critical, optimistic, etc.) as conveyed through word choice and style.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "e11-es-01",
    subjectId: "english",
    topic: "Essay structure",
    grade: 11,
    stage: "ged",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "In a standard five-paragraph essay, the thesis statement usually appears in: [1 mark]",
    choices: [
      "the concluding paragraph only",
      "the introduction",
      "every body paragraph’s final sentence",
      "the title alone",
    ],
    correctAnswer: "1",
    explanation:
      "The thesis typically ends (or appears in) the introduction and states the essay’s central argument or controlling idea.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e11-es-02",
    subjectId: "english",
    topic: "Essay structure",
    grade: 11,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Plan an essay on the topic: “Should secondary schools increase the number of extracurricular clubs?” Write: (a) a thesis statement, (b) three topic sentences for body paragraphs, and (c) one concluding idea. Do not write the full essay. [6 marks]",
    correctAnswer:
      "(a) clear stance thesis; (b) three distinct topic sentences supporting the thesis; (c) concluding idea restating stance / wider implication",
    rubricNotes:
      "Thesis clarity 2; three relevant topic sentences 3; concluding idea 1.",
    explanation:
      "Planning shows organisation before drafting: a clear thesis, one main idea per body paragraph, and a closing thought that does not introduce unrelated points.",
    marks: 6,
    tags: ["exam-style"],
  },
  {
    id: "e11-ge-01",
    subjectId: "english",
    topic: "Grammar essentials",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "Select the sentence with correct subject–verb agreement: [1 mark]",
    choices: [
      "The list of required books are on the board.",
      "The list of required books is on the board.",
      "The list of required books were on the board.",
      "The list of required books have on the board.",
    ],
    correctAnswer: "1",
    explanation:
      "The subject is “list” (singular), not “books”; therefore the verb is is.",
    marks: 1,
    tags: ["exam-style"],
    explanationAr:
      "الفاعل هو list (مفرد) وليس books؛ لذا الفعل الصحيح هو is.",
  },
  {
    id: "e11-vb-01",
    subjectId: "english",
    topic: "Vocabulary building",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "Which word is closest in meaning to beneficial in academic writing? [1 mark]",
    choices: ["harmful", "advantageous", "uncertain", "temporary"],
    correctAnswer: "1",
    explanation:
      "Beneficial means producing a good effect; advantageous is the closest synonym.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e11-sw-01",
    subjectId: "english",
    topic: "Summary writing",
    grade: 11,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Summarise the following ideas in 50–60 words: Urban parks improve air quality, provide space for exercise, and support community events. However, they require regular maintenance and funding. Include both benefits and the challenge. [6 marks]",
    correctAnswer:
      "Own-words summary covering air quality, exercise space, community events, plus need for maintenance/funding; 50–60 words; no unnecessary detail",
    rubricNotes:
      "Key benefits covered 3; challenge included 1; own words & length 2.",
    explanation:
      "Effective summary writing balances main benefits with the stated limitation and stays within the word range without copying the source.",
    marks: 6,
    tags: ["exam-style"],
  },
  {
    id: "e11-le-01",
    subjectId: "english",
    topic: "Letter & email writing",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "structured",
    prompt:
      "Write a formal letter (120–150 words) to a local newspaper editor about the need for safer pedestrian crossings near schools. Include your view, two supporting reasons, and a suggested action. [8 marks]",
    correctAnswer:
      "Formal letter layout; clear opinion; two reasons; practical suggestion; polite formal close; ~120–150 words",
    rubricNotes:
      "Task fulfilment 4; organisation & formal style 2; language accuracy 2.",
    explanation:
      "A formal letter to an editor should state a clear position, support it with reasons, propose a solution, and maintain formal register throughout.",
    marks: 8,
    tags: ["exam-style"],
    promptAr:
      "اكتب رسالة رسمية (١٢٠–١٥٠ كلمة) إلى محرر صحيفة محلية عن الحاجة إلى معابر مشاة أكثر أماناً قرب المدارس. اذكر رأيك وسببين داعمين واقتراح إجراء. [٨ درجات]",
  },

  // ── Grade 12 (ged) ───────────────────────────────────────────────
  {
    id: "e12-cr-01",
    subjectId: "english",
    topic: "Critical reading",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "mcq",
    prompt:
      "An advertisement states: “Nine out of ten experts recommend Product X.” A critical reader should first ask: [2 marks]",
    choices: [
      "Whether the claim sounds impressive enough to buy immediately",
      "Who the experts are, how many were surveyed, and whether the sample is biased",
      "How colourful the product packaging is",
      "Whether the company used capital letters",
    ],
    correctAnswer: "1",
    explanation:
      "Critical reading questions evidence: source, sample size, and possible bias behind statistical claims.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "e12-cr-02",
    subjectId: "english",
    topic: "Critical reading",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "short",
    prompt:
      "Define “bias” as it applies to a news article, and give one example of how bias might appear. [3 marks]",
    correctAnswer:
      "Bias: unfair preference/one-sided presentation|example: selective facts, loaded language, omitting opposing views",
    explanation:
      "Bias is a one-sided or unfair slant; it may appear through loaded wording, selective evidence, or ignoring counter-arguments.",
    marks: 3,
    tags: ["exam-style"],
    explanationAr:
      "التحيز هو ميل غير عادل أو عرض أحادي الجانب؛ يظهر عبر لغة مشحونة أو انتقاء الأدلة أو تجاهل الآراء المعارضة.",
  },
  {
    id: "e12-ae-01",
    subjectId: "english",
    topic: "Argumentative essays",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Write an argumentative essay (180–220 words) on: “Public transport should be free for secondary-school students.” Take a clear position, support it with at least two reasoned arguments, address one opposing view, and conclude. [12 marks]",
    correctAnswer:
      "Clear thesis; ≥2 supported arguments; counter-argument + response; logical conclusion; formal academic style; ~180–220 words",
    rubricNotes:
      "Position & argumentation 5; counter-argument 2; organisation 2; language range & accuracy 3.",
    explanation:
      "Argumentative essays require a firm stance, developed reasons, acknowledgement of an opposing view, and a controlled formal conclusion.",
    marks: 12,
    tags: ["exam-style"],
  },
  {
    id: "e12-ae-02",
    subjectId: "english",
    topic: "Argumentative essays",
    grade: 12,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "Which feature is most characteristic of a strong argumentative essay? [1 mark]",
    choices: [
      "Emotional insults against people who disagree",
      "A clear thesis supported by reasoned evidence and consideration of counter-arguments",
      "A story with no opinion stated",
      "A list of questions without answers",
    ],
    correctAnswer: "1",
    explanation:
      "Strong argumentation rests on a clear claim, evidence, and engagement with opposing views—not personal attacks.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e12-ag-01",
    subjectId: "english",
    topic: "Advanced grammar",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "mcq",
    prompt:
      "Choose the sentence that correctly uses a conditional structure: [2 marks]",
    choices: [
      "If she studied harder, she will pass the exam last year.",
      "If she had studied harder, she would have passed the exam.",
      "If she study harder, she would have passed the exam.",
      "If she would study harder, she passed the exam.",
    ],
    correctAnswer: "1",
    explanation:
      "The third conditional (had + past participle / would have + past participle) refers to an unreal past situation and its imagined result.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "e12-el-01",
    subjectId: "english",
    topic: "Exam listening strategies",
    grade: 12,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "Before an exam listening recording begins, the most effective strategy is to: [1 mark]",
    choices: [
      "Ignore the questions and wait for the audio",
      "Read the questions carefully and predict possible answers or key words",
      "Write the full transcript of an imaginary dialogue",
      "Close the question paper so you are not distracted",
    ],
    correctAnswer: "1",
    explanation:
      "Previewing questions and predicting key words focuses attention and improves accuracy during the recording.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "e12-rw-01",
    subjectId: "english",
    topic: "Report writing",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Your school surveyed 200 students about lunch preferences. Write a short formal report (140–180 words) with headings for Introduction, Findings, and Recommendations. Base findings on: 55% prefer hot meals, 30% prefer sandwiches, 15% prefer salads; many request more vegetarian options. [10 marks]",
    correctAnswer:
      "Title/purpose; Introduction; Findings (use given figures accurately); Recommendations (e.g. more vegetarian/hot options); formal impersonal style; ~140–180 words",
    rubricNotes:
      "Report structure & headings 3; accurate use of data 3; useful recommendations 2; formal language 2.",
    explanation:
      "Reports present purpose, factual findings (often with figures), and practical recommendations in a clear, impersonal formal style.",
    marks: 10,
    tags: ["exam-style"],
  },
  {
    id: "e12-op-01",
    subjectId: "english",
    topic: "Oral presentation skills",
    grade: 12,
    stage: "ged",
    difficulty: "medium",
    type: "structured",
    prompt:
      "You will give a three-minute oral presentation on “Time management for exam success.” Outline: (a) an opening hook, (b) three main points with one supporting detail each, and (c) a closing call to action. [6 marks]",
    correctAnswer:
      "(a) engaging opening; (b) three clear points + one detail each (e.g. planning, priorities, breaks); (c) memorable call to action for peers",
    rubricNotes:
      "Opening 1; three developed points 3; closing call to action 1; clarity/organisation 1.",
    explanation:
      "Effective oral presentations need a strong opening, a limited number of well-supported points, and a purposeful ending that tells the audience what to do next.",
    marks: 6,
    tags: ["exam-style"],
    promptAr:
      "ستقدّم عرضاً شفهياً لمدة ثلاث دقائق عن «إدارة الوقت لنجاح الامتحانات». خطّط: (أ) افتتاحاً جذاباً، (ب) ثلاث نقاط رئيسية مع تفصيل داعم لكل منها، (ج) ختاماً يدعو إلى اتخاذ إجراء. [٦ درجات]",
  },
];
