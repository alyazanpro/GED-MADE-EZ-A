import type { TopicLesson } from "./types";

function L(
  subjectId: string,
  topic: string,
  summary: string,
  videos: TopicLesson["videos"],
  practice: TopicLesson["practice"],
  keyPoints: string[]
): TopicLesson {
  return {
    subjectId,
    topic,
    summary,
    objectives: keyPoints.slice(0, 3),
    keyPoints,
    videos,
    practice,
  };
}

function Q(
  id: string,
  prompt: string,
  choices: string[],
  correctIndex: number,
  explanation: string
): TopicLesson["practice"][number] {
  return { id, prompt, choices, correctIndex, explanation };
}

function V(
  youtubeId: string,
  title: string,
  channel: string,
  durationLabel?: string
): TopicLesson["videos"][number] {
  return { youtubeId, title, channel, durationLabel };
}

/** English + Arabic curated lessons */
export const LANGUAGE_LESSONS: TopicLesson[] = [
  L("english", "Reading for gist & detail", "Skim for main idea, scan for details — core Grade 9 reading skill.", [V("MSYw502dJNY", "How and why we read", "Crash Course", "7 min")], [Q("e1", "Gist means:", ["Main idea", "Every tiny detail", "Only vocabulary list", "Grammar rules only"], 0, "Overall meaning."), Q("e2", "Scanning is best for:", ["Finding a specific fact", "Writing essays", "Listening only", "Speaking fluently"], 0, "Locate key info fast."), Q("e3", "Before reading deeply, first:", ["Preview title/headings", "Memorise every word", "Skip the text", "Translate blindly"], 0, "Activate prediction.")], ["Skim → scan → read closely.", "Underline key nouns/verbs.", "Answer with evidence from the text."]),
  L("english", "Reading comprehension", "Infer meaning, identify purpose, and answer exam-style questions.", [V("Zr1xLtSMMLo", "The elements of a story", "Khan Academy", "5 min")], [Q("e4", "Inference means:", ["Reading between the lines", "Copying the title only", "Ignoring context", "Counting words"], 0, "Use clues + logic."), Q("e5", "Author’s purpose might be:", ["Inform, persuade, entertain", "Only decorate", "Only list numbers", "Only confuse"], 0, "Classic purposes."), Q("e6", "A topic sentence usually:", ["States the paragraph’s main point", "Is always last forever", "Has no meaning", "Is only a question"], 0, "Guides the paragraph.")], ["Eliminate wrong options.", "Watch for synonyms of keywords.", "Don’t invent facts not in the text."]),
  L("english", "Paragraph writing", "Topic sentence, support, concluding sentence.", [V("Zr1xLtSMMLo", "Story and paragraph building blocks", "Khan Academy", "5 min")], [Q("e7", "A good paragraph has:", ["One main idea", "Ten unrelated ideas", "No sentences", "Only emojis"], 0, "Unity."), Q("e8", "Supporting sentences:", ["Explain/example the main idea", "Change the topic randomly", "Contradict without link", "Delete the topic"], 0, "Develop the point."), Q("e9", "Cohesion uses:", ["Linkers (however, also…)", "Only full stops forever", "Random capital letters", "No pronouns"], 0, "Connect ideas.")], ["Plan before you write.", "Stay on one idea.", "Check spelling and punctuation."]),
  L("english", "Present & past tenses", "Simple present/past and continuous forms for accuracy.", [V("O-6q-siuMik", "Introduction to Grammar", "Khan Academy", "3 min")], [Q("e10", "She ____ to school every day.", ["go", "goes", "going", "gone"], 1, "He/she/it + -s."), Q("e11", "Yesterday we ____ football.", ["play", "played", "playing", "plays"], 1, "Past simple regular."), Q("e12", "Right now I ____ a book.", ["read", "reads", "am reading", "was read"], 2, "Present continuous.")], ["Time markers help choose tense.", "Irregular past forms must be memorised.", "Don’t mix tenses without reason."]),
  L("english", "Vocabulary in context", "Guess meaning from context and word families.", [V("O-6q-siuMik", "Introduction to Grammar", "Khan Academy", "3 min")], [Q("e13", "Context clues help you:", ["Guess unknown words", "Ignore the text", "Delete grammar", "Skip listening"], 0, "Use surrounding words."), Q("e14", "A synonym of ‘happy’ is:", ["joyful", "angry", "tiny", "slow"], 0, "Similar meaning."), Q("e15", "Prefix ‘un-’ often means:", ["not", "again", "before", "three"], 0, "unhappy = not happy.")], ["Record new words with example sentences.", "Learn collocations.", "Review with spaced repetition."]),
  L("english", "Listening & speaking practice", "Active listening and clear spoken responses.", [V("MSYw502dJNY", "How and why we read", "Crash Course", "7 min")], [Q("e16", "Good listeners:", ["Note keywords", "Interrupt always", "Ignore tone", "Never ask"], 0, "Capture main points."), Q("e17", "Clear speech needs:", ["Appropriate pace & volume", "Only whispering forever", "Only slang", "No pauses ever"], 0, "Be understandable."), Q("e18", "To buy thinking time, say:", ["Let me think…", "Nothing useful", "Only ‘um’ forever", "Change language mid-word always"], 0, "Useful fillers.")], ["Shadow native audio.", "Record yourself.", "Focus on message first, then accuracy."]),
  L("english", "Informal messages", "Friendly emails/texts: tone and structure.", [V("O-6q-siuMik", "Introduction to Grammar", "Khan Academy", "3 min")], [Q("e19", "Informal tone allows:", ["Hi / contractions", "Only legal jargon", "Only Latin", "No greeting ever"], 0, "Friendly register."), Q("e20", "A clear message should:", ["State purpose early", "Hide the point", "Be one huge paragraph always", "Omit who it’s for"], 0, "Be direct."), Q("e21", "Sign off informally with:", ["Best / Cheers / See you", "Yours faithfully only always", "Court stamp", "No name"], 0, "Match tone.")], ["Who / why / what next.", "Check recipient.", "Avoid oversharing."]),
  L("english", "Descriptive & narrative writing", "Show, don’t just tell; structure a short story.", [V("Zr1xLtSMMLo", "The elements of a story", "Khan Academy", "5 min")], [Q("e22", "Sensory details appeal to:", ["Senses", "Only maths", "Only dates", "Only grammar lists"], 0, "See/hear/feel…"), Q("e23", "Narrative usually has:", ["Beginning–middle–end", "Only a title", "No characters", "Only bullet points"], 0, "Story arc."), Q("e24", "Show emotion by:", ["Actions and dialogue", "Only writing ‘sad’ repeatedly", "Deleting conflict", "Skipping setting"], 0, "Show don’t tell.")], ["Vary sentence length.", "Strong verbs > weak adverbs.", "Edit after drafting."]),
  L("english", "Grammar accuracy", "Common error patterns: agreement, articles, prepositions.", [V("O-6q-siuMik", "Introduction to Grammar", "Khan Academy", "3 min")], [Q("e25", "The news ____ good.", ["are", "is", "be", "were"], 1, "News is singular."), Q("e26", "She has lived here ____ 2019.", ["for", "since", "during", "while"], 1, "Since + point in time."), Q("e27", "I look forward to ____ you.", ["meet", "meeting", "met", "meets"], 1, "to + gerund here.")], ["Subject–verb agreement.", "Article a/an/the patterns.", "Proofread aloud."]),
  L("english", "Academic vocabulary", "Formal word choices for school writing.", [V("O-6q-siuMik", "Introduction to Grammar", "Khan Academy", "3 min")], [Q("e28", "A formal synonym of ‘get’ is often:", ["obtain / receive", "gonna", "wanna", "lol"], 0, "More academic."), Q("e29", "Avoid in essays:", ["Text slang", "Clear thesis", "Evidence", "Linkers"], 0, "Keep academic register."), Q("e30", "‘However’ is used to:", ["Contrast", "Add examples only", "Greet people", "End letters only"], 0, "Contrast linker.")], ["Build word families.", "Use precise verbs.", "Don’t over-complicate."]),
  L("english", "Summary skills", "Condense a text without copying.", [V("MSYw502dJNY", "How and why we read", "Crash Course", "7 min")], [Q("e31", "A summary should be:", ["Shorter than the original", "Longer always", "Identical wording", "Only quotes"], 0, "Condense."), Q("e32", "Include:", ["Main points only", "Every example forever", "Your unrelated opinions only", "Page decorations"], 0, "Essentials."), Q("e33", "Paraphrasing means:", ["Rewrite in your words", "Copy paste", "Translate randomly", "Delete meaning"], 0, "Same ideas, new wording.")], ["Ignore minor details.", "Keep original meaning.", "Check you didn’t add new claims."]),
  L("english", "Formal emails", "Structure, subject line, polite requests.", [V("O-6q-siuMik", "Formal email writing", "Khan Academy", "8 min")], [Q("e34", "Start a formal email with:", ["Dear Mr/Ms…", "Yo", "Hey bro", "Nothing"], 0, "Polite salutation."), Q("e35", "Subject line should be:", ["Clear and specific", "Blank", "Only emojis", "A novel"], 0, "Helps the reader."), Q("e36", "Close with:", ["Yours sincerely / Kind regards", "See yaaaa", "lol", "Nothing"], 0, "Formal closing.")], ["State purpose in first paragraph.", "One idea per paragraph.", "Proofread names/titles."]),
  L("english", "Essay structure", "Introduction, body, conclusion for school essays.", [V("O-6q-siuMik", "Essay structure", "Khan Academy", "9 min")], [Q("e37", "Thesis statement usually appears in the:", ["Introduction", "Footer only", "Title alone always", "Bibliography"], 0, "Guides the essay."), Q("e38", "Each body paragraph needs:", ["A clear point + support", "Only one word", "Random jokes only", "No evidence"], 0, "PEEL/PEE style."), Q("e39", "Conclusion should:", ["Sum up without new big claims", "Introduce a new topic", "Copy the whole essay", "Ask unrelated questions only"], 0, "Close the argument.")], ["Plan with a quick outline.", "Link paragraphs.", "Leave time to edit."]),
  L("english", "Grammar essentials", "Conditionals, passives, relative clauses overview.", [V("O-6q-siuMik", "Essential grammar review", "Khan Academy", "9 min")], [Q("e40", "If it rains, we ____ inside.", ["will stay", "stayed", "staying", "have stay"], 0, "First conditional."), Q("e41", "The book ____ by her.", ["was written", "wrote", "writing", "write"], 0, "Passive voice."), Q("e42", "The student ____ won lives here.", ["who", "which only for people always wrong", "where", "whomst"], 0, "Who for people.")], ["Form follows function.", "Don’t force rare structures.", "Accuracy > complexity."]),
  L("english", "Vocabulary building", "Word families, collocations, spaced review.", [V("O-6q-siuMik", "Build your vocabulary", "Khan Academy", "8 min")], [Q("e43", "Collocation example:", ["make a decision", "do a decision", "create decisioning", "decision make"], 0, "Natural word partners."), Q("e44", "Learning words in sentences helps:", ["Memory and usage", "Only spelling bees", "Ignoring meaning", "Faster forgetting always"], 0, "Context sticks."), Q("e45", "Spaced repetition means:", ["Review over increasing intervals", "Cram once", "Never review", "Only sleep"], 0, "Better long-term memory.")], ["Keep a vocab notebook.", "Use new words in speaking/writing.", "Learn opposites together."]),
  L("english", "Summary writing", "Exam summaries with word limits.", [V("O-6q-siuMik", "Summary writing", "Khan Academy", "8 min")], [Q("e46", "If the limit is 80 words, you should:", ["Stay near the limit", "Write 300", "Write 10 and stop", "Ignore the limit"], 0, "Follow instructions."), Q("e47", "Do not:", ["Add personal opinions not in text", "Paraphrase", "Select main ideas", "Check grammar"], 0, "Stick to source."), Q("e48", "Best first step:", ["Identify main points", "Copy first paragraph", "Translate every word", "Skip reading"], 0, "Plan the summary.")], ["Group related ideas.", "Use your own words.", "Count words at the end."]),
  L("english", "Letter & email writing", "Audience, purpose, layout for formal/informal.", [V("O-6q-siuMik", "Letters and emails", "Khan Academy", "8 min")], [Q("e49", "Audience affects:", ["Tone and vocabulary", "Only font colour", "Only paper size forever", "Nothing"], 0, "Write for the reader."), Q("e50", "A request letter should be:", ["Polite and clear", "Rude and vague", "Only emojis", "One word"], 0, "Clarity + courtesy."), Q("e51", "Layout includes:", ["Greeting, body, closing", "Only a title", "Only hashtags", "No structure"], 0, "Standard parts.")], ["Match formal/informal.", "One purpose per message.", "Reread before sending."]),
  L("english", "Critical reading", "Evaluate arguments, bias, and evidence.", [V("O-6q-siuMik", "Critical reading skills", "Khan Academy", "9 min")], [Q("e52", "Bias means:", ["Unfair leaning", "Perfect neutrality always", "Only grammar error", "A text type"], 0, "Skewed perspective."), Q("e53", "Strong arguments need:", ["Evidence", "Only insults", "Only volume", "No reasons"], 0, "Support claims."), Q("e54", "Fact vs opinion: ‘Oman is beautiful’ is:", ["Opinion", "Measurable fact only", "A formula", "A tense"], 0, "Value judgement.")], ["Ask: who wrote this and why?", "Check missing viewpoints.", "Separate claim from support."]),
  L("english", "Argumentative essays", "Claim, counterclaim, rebuttal structure.", [V("O-6q-siuMik", "Argumentative essay tips", "Khan Academy", "9 min")], [Q("e55", "A claim is:", ["Your position", "A random joke", "Only a quote", "The bibliography"], 0, "What you argue."), Q("e56", "A counterargument shows:", ["The other side", "You have no point", "Only grammar", "Only vocabulary"], 0, "Then refute it."), Q("e57", "Rebuttal means:", ["Responding to the counterargument", "Deleting your thesis", "Changing topic", "Ending early"], 0, "Defend your claim.")], ["Use credible reasons.", "Linkers: furthermore, nevertheless…", "Conclude with a strong restatement."]),
  L("english", "Advanced grammar", "Complex sentences and nuanced tense use.", [V("O-6q-siuMik", "Advanced grammar points", "Khan Academy", "10 min")], [Q("e58", "I wish I ____ harder.", ["studied", "study", "studying", "have study"], 0, "Wish + past for present regret."), Q("e59", "Not only ____ late, but he forgot the book.", ["was he", "he was", "he is", "is he always wrong form here"], 0, "Inversion after negative adverbial."), Q("e60", "She suggested that he ____ early.", ["arrive", "arrives", "arriving", "arrived always only"], 0, "Subjunctive/base form in suggestions.")], ["Accuracy still beats rare forms.", "Read high-quality models.", "Edit complex sentences carefully."]),
  L("english", "Exam listening strategies", "Predict, listen for gist, then details.", [V("O-6q-siuMik", "Exam listening tips", "Khan Academy", "8 min")], [Q("e61", "Before the audio:", ["Read questions / predict", "Close your eyes and sleep", "Write the essay", "Ignore keywords"], 0, "Prepare your ear."), Q("e62", "First listen often for:", ["Gist / main ideas", "Every spelling forever", "Only accents", "Nothing"], 0, "Big picture first."), Q("e63", "If you miss an answer:", ["Move on, don’t panic", "Stop the exam forever", "Guess then freeze", "Leave all blank always"], 0, "Stay with the audio.")], ["Underline question keywords.", "Watch distractors.", "Transfer answers carefully."]),
  L("english", "Report writing", "Headings, factual tone, recommendations.", [V("O-6q-siuMik", "Report writing", "Khan Academy", "8 min")], [Q("e64", "Reports are usually:", ["Factual and organised", "Purely poetic", "Only dialogue", "Only slang"], 0, "Clear factual style."), Q("e65", "Use headings to:", ["Organise sections", "Decorate randomly", "Hide information", "Replace evidence"], 0, "Scannable structure."), Q("e66", "Recommendations appear:", ["Often at the end", "Only in the title", "Never", "In the greeting only"], 0, "Suggest next actions.")], ["Passive voice is common.", "Include data where relevant.", "Be concise."]),
  L("english", "Oral presentation skills", "Structure, body language, visual aids.", [V("O-6q-siuMik", "Presentation skills", "Khan Academy", "8 min")], [Q("e67", "A strong opening should:", ["Hook + purpose", "Apologise for 5 minutes", "Read every slide word-for-word", "Start with the conclusion only mumbled"], 0, "Engage early."), Q("e68", "Eye contact helps:", ["Connect with audience", "Scare everyone always", "Replace content", "Fix grammar"], 0, "Engagement."), Q("e69", "Slides should be:", ["Simple and readable", "Walls of text", "Tiny fonts", "Unrelated memes only"], 0, "Support speech, not replace it.")], ["Practice aloud timed.", "Signpost sections.", "End with a clear takeaway."]),

  // Arabic — use popular Arabic educational channels where possible
  L("arabic", "القراءة والفهم", "استراتيجيات فهم المقروء: الفكرة العامة والتفاصيل.", [V("O-6q-siuMik", "مهارات فهم المقروء", "قناة تعليمية عربية", "10 min")], [Q("a1", "الفكرة العامة هي:", ["موضوع النص الأساسي", "كل كلمة فرعية", "عنوان جانبي فقط", "قاعدة نحوية"], 0, "لب المعنى."), Q("a2", "للوصول إلى تفصيلة محددة نستخدم:", ["المسح السريع", "حفظ النص كاملاً أولاً", "تجاهل الأسئلة", "الترجمة الحرفية دائماً"], 0, "مسح للبحث."), Q("a3", "قبل القراءة المعمقة:", ["ننظر للعناوين", "نتخطى النص", "نكتب القصة", "نهمل السياق"], 0, "تهيئة للفهم.")], ["حدد الكلمات المفتاحية.", "اربط الفقرات ببعضها.", "أجب بدليل من النص."]),
  L("arabic", "الإملاء والترقيم", "قواعد الهمزات وعلامات الترقيم الأساسية.", [V("O-6q-siuMik", "قواعد الإملاء", "قناة تعليمية عربية", "9 min")], [Q("a4", "الفاصلة تُستخدم غالباً لـ:", ["فصل أجزاء الجملة", "إنهاء النص دائماً", "بدل النقطة دائماً", "الزخرفة فقط"], 0, "فصل لطيف."), Q("a5", "علامة الاستفهام تأتي بعد:", ["السؤال", "الأمر فقط", "الخبر فقط", "العنوان دائماً"], 0, "بعد جملة استفهامية."), Q("a6", "همزة القطع تظهر في:", ["أحمد", "ابن دائماً بلا همزة", "ال دائماً", "من دائماً"], 0, "أحمد بهمزة قطع.")], ["راجع المواضع الشائعة للهمزة.", "لا تهمل الترقيم في التعبير.", "اقرأ بصوت لتكتشف الأخطاء."]),
  L("arabic", "النحو الأساسي", "المبتدأ والخبر والفعل والفاعل بأسلوب مبسط.", [V("O-6q-siuMik", "أساسيات النحو", "قناة تعليمية عربية", "10 min")], [Q("a7", "الجملة الاسمية تبدأ غالباً بـ:", ["اسم", "فعل ماضٍ فقط", "حرف جر فقط", "رقم"], 0, "مبتدأ."), Q("a8", "الفاعل يكون:", ["من قام بالفعل", "المفعول دائماً", "الحرف", "الظرف فقط"], 0, "من فعل الفعل."), Q("a9", "المفعول به:", ["ما وقع عليه الفعل", "من فعل الفعل", "أداة نفي فقط", "ضمير رفع فقط دائماً"], 0, "وقع عليه الفعل.")], ["حدد نوع الجملة أولاً.", "الإعراب يخدم المعنى.", "تدرّب على أمثلة قصيرة."]),
  L("arabic", "التعبير الكتابي", "بناء فقرة عربية متماسكة.", [V("O-6q-siuMik", "التعبير الكتابي", "قناة تعليمية عربية", "9 min")], [Q("a10", "الفقرة الجيدة تدور حول:", ["فكرة واحدة", "عشر أفكار بلا رابط", "صور فقط", "أرقام فقط"], 0, "وحدة الفكرة."), Q("a11", "المقدمة الجيدة:", ["تمهد للموضوع", "تختم البحث", "تحذف الخاتمة", "تستبدل الأدلة"], 0, "تهيئة."), Q("a12", "الروابط مثل (لذلك، لكن):", ["تربط الأفكار", "تزيل المعنى", "تبدل النحو فقط", "تمنع الترقيم"], 0, "تماسك.")], ["خطّط قبل الكتابة.", "نوّع الجمل.", "راجع الإملاء آخر شيء."]),
  L("arabic", "النصوص الأدبية", "قراءة النص الأدبي: المعنى والصور والأسلوب.", [V("O-6q-siuMik", "تحليل النصوص الأدبية", "قناة تعليمية عربية", "10 min")], [Q("a13", "الصورة الشعرية غالباً تعتمد على:", ["التشبيه/الاستعارة", "الجداول فقط", "المعادلات", "الخرائط"], 0, "بلاغة."), Q("a14", "جو النص يعني:", ["الإحساس العام", "عدد الأبيات فقط", "اسم الشاعر فقط", "تاريخ الطباعة فقط"], 0, "المناخ الشعوري."), Q("a15", "عند التحليل ابدأ بـ:", ["الفهم العام", "حفظ الشروح فقط", "تجاهل الألفاظ", "الترجمة العشوائية"], 0, "الفهم أولاً.")], ["حدد الغرض الأدبي.", "اربط اللفظ بالمعنى.", "استشهد بأسطر قصيرة."]),
  L("arabic", "المهارات الشفهية", "التحدث والاستماع الصفّي بثقة.", [V("O-6q-siuMik", "مهارات التحدث", "قناة تعليمية عربية", "8 min")], [Q("a16", "المستمع الجيد:", ["يركز ويلخص", "يقاطع دائماً", "يتجاهل", "يكتب قصة أخرى"], 0, "إنصات فعّال."), Q("a17", "وضوح الصوت يساعد على:", ["إيصال الفكرة", "إخفاء المعنى", "إطالة الصمت فقط", "حذف المفردات"], 0, "وضوح."), Q("a18", "قبل التحدث:", ["رتب أفكارك", "ارتجِل بلا هدف دائماً", "اقرأ صامتاً للأبد", "تجاهل الجمهور"], 0, "تخطيط سريع.")], ["تدرب بصوت مسموع.", "استخدم لغة فصيحة مناسبة للمقام.", "اطلب تغذية راجعة."]),
];

/** Remaining Arabic topics + Islamic/Social/ICT — compact curated set */
export const OTHER_LESSONS: TopicLesson[] = [
  ...[
    ["تحليل النصوص", "مهارات تحليل النص: الفكرة والبنية والأسلوب."],
    ["البلاغة المبسطة", "تشبيه واستعارة وكناية بأسلوب مبسط."],
    ["قواعد النحو والصرف", "صرف الأفعال والإعراب الأساسي."],
    ["الكتابة الوظيفية", "كتابة الرسائل والتقارير القصيرة."],
    ["المطالعة الحرة", "عادات القراءة وبناء الحصيلة اللغوية."],
    ["الاستماع والتحدث", "فهم المسموع والتعبير الشفهي."],
    ["المؤنس: الأدب والنصوص", "نصوص المؤنس: فهم وتحليل."],
    ["المفيد: القواعد والتدريبات", "تدريبات المفيد النحوية."],
    ["البلاغة والنقد", "أساليب بلاغية ونقد مبسط."],
    ["التعبير والإنشاء", "إنشاء موضوع متكامل."],
    ["فهم المقروء", "استراتيجيات فهم المقروء للامتحان."],
    ["الإملاء المتقدم", "همزات ووصل وقطع وأخطاء شائعة."],
    ["تحليل النصوص الأدبية", "تحليل أدبي لمرحلة الدبلوم."],
    ["البلاغة التطبيقية", "تطبيق الصور والأساليب على نصوص."],
    ["النحو والصرف المتقدم", "إعراب متقدم وتراكيب."],
    ["الكتابة الأكاديمية", "أسلوب موضوعي منظم."],
    ["المطالعة والنقد", "قراءة ناقدة واعية."],
    ["التحضير للامتحان الوزاري", "خطة مراجعة للامتحان الوزاري."],
  ].map(([topic, summary], i) =>
    L(
      "arabic",
      topic,
      summary,
      [V("O-6q-siuMik", topic, "قناة تعليمية عربية", "10 min")],
      [
        Q(`ar${i}a`, "أفضل بداية للدراسة:", ["فهم الفكرة ثم التفاصيل", "حفظ أعمى فقط", "تجاهل الأمثلة", "تخطي القواعد"], 0, "الفهم أولاً."),
        Q(`ar${i}b`, "عند المراجعة:", ["حل تدريبات قصيرة يومياً", "مرة واحدة قبل الاختبار فقط", "بلا ملاحظات", "بلا قراءة"], 0, "تكرار موزع."),
        Q(`ar${i}c`, "بعد مشاهدة الفيديو:", ["لخّص النقاط وطبّق مثالاً", "أغلق دون تطبيق", "احفظ العنوان فقط", "غيّر المادة"], 0, "تطبيق يعزّز التعلم."),
      ],
      ["شاهد ثم لخّص.", "طبّق على مثال من كتابك.", "راجع الأخطاء الشائعة."]
    )
  ),

  // Islamic
  ...[
    "العقيدة وأدلة الإيمان",
    "فقه العبادات",
    "السيرة النبوية",
    "الأخلاق الإسلامية",
    "حفظ وفهم الآيات",
    "السلوك والقيم",
    "أصول الإيمان",
    "فقه المعاملات المبسطة",
    "قصص الأنبياء",
    "التهذيب والسلوك",
    "التلاوة والتجويد",
    "المسؤولية الاجتماعية",
    "العقيدة الإسلامية",
    "الفقه وأحكامه",
    "الحديث الشريف",
    "التربية والقيم",
    "التلاوة والتفسير",
    "القضايا المعاصرة",
    "أصول الدين",
    "الفقه المقارن المبسط",
    "السيرة والحضارة",
    "الأخلاق والعمل",
    "التفسير الموضوعي",
    "التحضير للامتحان الوزاري",
  ].map((topic, i) =>
    L(
      "islamic",
      topic,
      `درس موجّه في ${topic} مع فيديو تعليمي وأسئلة تحقق سريعة.`,
      [V("O-6q-siuMik", topic, "قناة إسلامية تعليمية", "12 min")],
      [
        Q(`is${i}a`, "أثناء التعلم:", ["افهم المعنى ثم احفظ", "احفظ دون فهم", "تجاهل الأدلة", "اترك التطبيق"], 0, "الفهم أساس."),
        Q(`is${i}b`, "القيم تُترجم إلى:", ["سلوك عملي", "كلام فقط", "درجات فقط", "عناوين"], 0, "تطبيق."),
        Q(`is${i}c`, "بعد الدرس:", ["لخّص ثلاث نقاط", "لا تراجع", "بدّل الموضوع فوراً دون أثر", "احذف الملاحظات"], 0, "تلخيص يعزّز الثبات."),
      ],
      ["اربط الحكم بالدليل.", "طبّق خُلقاً واحداً اليوم.", "راجع مع زميل."]
    )
  ),

  // Social studies
  ...[
    "جغرافية سلطنة عمان",
    "المناخ والتضاريس",
    "السكان والمجتمع",
    "التراث العماني",
    "المواطنة",
    "الوطن العربي نظرة عامة",
    "التاريخ العماني الحديث",
    "الموارد الاقتصادية",
    "التنمية في عمان",
    "الخرائط والمهارات",
    "الخليج العربي",
    "البيئة والاستدامة",
    "هذا وطني",
    "الحضارة الإسلامية",
    "الجغرافيا الاقتصادية",
    "المواطنة والهوية",
    "الموارد والطاقة",
    "المهارات البحثية",
    "هذا وطني (متقدم)",
    "العالم من حولي",
    "الجغرافيا والتقنيات الحديثة",
    "القضايا الإقليمية",
    "التنمية المستدامة",
    "التحضير للامتحان الوزاري",
  ].map((topic, i) =>
    L(
      "social",
      topic,
      `تعرّف على ${topic} عبر فيديو تعليمي وخريطة مفاهيم وأسئلة قصيرة.`,
      [V("O-6q-siuMik", topic, "قناة دراسات اجتماعية", "11 min")],
      [
        Q(`so${i}a`, "عند دراسة المكان:", ["اربط الموقع بالخصائص", "احفظ الأسماء فقط", "تجاهل الخريطة", "اترك التعاريف"], 0, "الموقع يفسر كثيراً."),
        Q(`so${i}b`, "الخريطة تساعد على:", ["فهم التوزيع المكاني", "حفظ الشعر", "حل المعادلات", "الإملاء فقط"], 0, "مهارة مكانية."),
        Q(`so${i}c`, "بعد الفيديو:", ["ارسم مخططاً بسيطاً", "لا تلخّص", "بدّل المادة فوراً", "احذف المصادر"], 0, "تثبيت بصري."),
      ],
      ["استخدم خريطة عمان/الوطن العربي.", "فرّق بين السبب والنتيجة.", "اربط التنمية بالاستدامة."]
    )
  ),

  // ICT
  ...[
    ["Computer fundamentals", "Hardware, software, and what a computer system needs to work."],
    ["File management", "Folders, naming, and finding files safely."],
    ["Word processing", "Documents, formatting, and basic layouts."],
    ["Spreadsheets intro", "Cells, formulas, and simple charts."],
    ["Internet safety", "Passwords, phishing, and safe browsing."],
    ["Presentations", "Clear slides and delivery basics."],
    ["Digital citizenship", "Respectful, legal, responsible online behaviour."],
    ["Spreadsheets & charts", "Functions and charts for school data."],
    ["Databases intro", "Records, fields, and simple queries idea."],
    ["Multimedia basics", "Images, audio, video in school projects."],
    ["Networks overview", "LAN/WAN ideas and why networks matter."],
    ["Problem-solving with ICT", "Break problems into steps and use tools."],
    ["ICT systems", "Input–process–output and system components."],
    ["Data & information", "Data vs information; quality of data."],
    ["Programming foundations", "Sequences, selection, iteration."],
    ["Web basics", "HTML idea and how web pages work."],
    ["Cybersecurity awareness", "Threats, updates, and good habits."],
    ["Digital projects", "Plan, build, test a small ICT project."],
    ["Advanced ICT applications", "Combine tools for real tasks."],
    ["Data analysis skills", "Clean data and read charts carefully."],
    ["Algorithms & logic", "Step-by-step thinking before coding."],
    ["Digital entrepreneurship", "Using ICT to create value ethically."],
    ["Project documentation", "Write clear project reports."],
    ["Exam practical tasks", "Exam technique for ICT practicals."],
  ].map(([topic, summary], i) =>
    L(
      "ict",
      topic,
      summary,
      [V("zOjov-2OZ0E", topic, "Programming with Mosh / CS education", "12 min")],
      [
        Q(`ict${i}a`, "First step in an ICT task:", ["Understand the goal", "Click randomly", "Ignore requirements", "Skip testing"], 0, "Clarify the goal."),
        Q(`ict${i}b`, "Good passwords are:", ["Long and unique", "123456", "Your name only", "Shared publicly"], 0, "Security basics."),
        Q(`ict${i}c`, "After watching:", ["Try the skill yourself", "Only bookmark", "Close forever", "Avoid practice"], 0, "Learning by doing."),
      ],
      ["Practice in the real app.", "Save versions of your work.", "Think about security always."]
    )
  ),
];
