import type { ExamQuestion } from "./types";

export const BIOLOGY_EXAM: ExamQuestion[] = [
  // ── Grade 9 (basic) ──────────────────────────────────────────────
  {
    id: "b9-csb-01",
    subjectId: "biology",
    topic: "Cell structure basics",
    grade: 9,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Which organelle controls the activities of the cell and contains genetic material? [1 mark]",
    choices: ["Mitochondrion", "Nucleus", "Ribosome", "Cell wall"],
    correctAnswer: "1",
    explanation:
      "The nucleus contains DNA and coordinates cell activities. Mitochondria release energy; ribosomes make proteins; the cell wall supports plant cells only.",
    marks: 1,
    tags: ["exam-style"],
    promptAr: "أي عُضَيّة تتحكم في أنشطة الخلية وتحتوي على المادة الوراثية؟ [1 mark]",
    choicesAr: ["الميتوكوندريا", "النواة", "الريبوسوم", "الجدار الخلوي"],
    explanationAr:
      "النواة تحتوي على الحمض النووي DNA وتنسّق أنشطة الخلية.",
  },
  {
    id: "b9-csb-02",
    subjectId: "biology",
    topic: "Cell structure basics",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "short",
    prompt:
      "Name the organelle that releases energy by aerobic respiration in both plant and animal cells. [1 mark]",
    correctAnswer: "mitochondrion|mitochondria",
    explanation:
      "Mitochondria are the site of aerobic respiration, producing ATP for cellular processes in plants and animals.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b9-csb-03",
    subjectId: "biology",
    topic: "Cell structure basics",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "structured",
    prompt:
      "State two differences between a typical plant cell and a typical animal cell. [2 marks]",
    correctAnswer:
      "Plant cells have a cell wall (animal cells do not); plant cells usually have a large permanent vacuole / chloroplasts (animal cells do not)",
    explanation:
      "Award 1 mark per correct contrast: cell wall, chloroplasts, or large permanent vacuole present in plant cells but absent in animal cells.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "b9-org-01",
    subjectId: "biology",
    topic: "Organisation of living things",
    grade: 9,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "The correct order of organisation from simplest to most complex is: [1 mark]",
    choices: [
      "Organ → tissue → cell → organ system",
      "Cell → tissue → organ → organ system",
      "Tissue → cell → organ system → organ",
      "Organ system → organ → tissue → cell",
    ],
    correctAnswer: "1",
    explanation:
      "Cells group into tissues; tissues form organs; organs work together in organ systems.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b9-org-02",
    subjectId: "biology",
    topic: "Organisation of living things",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "short",
    prompt:
      "Define a tissue. [1 mark]",
    correctAnswer:
      "a group of similar cells working together|group of similar cells with a shared function",
    explanation:
      "A tissue is a group of similar cells that work together to perform a particular function (e.g. muscle tissue).",
    marks: 1,
    tags: ["exam-style"],
    promptAr: "عرّف النسيج. [1 mark]",
    explanationAr:
      "النسيج مجموعة من الخلايا المتشابهة تعمل معاً لأداء وظيفة معينة.",
  },
  {
    id: "b9-nut-01",
    subjectId: "biology",
    topic: "Nutrition in plants & animals",
    grade: 9,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Plants make their own food by photosynthesis. This type of nutrition is called: [1 mark]",
    choices: ["Heterotrophic", "Autotrophic", "Parasitic", "Saprophytic"],
    correctAnswer: "1",
    explanation:
      "Autotrophs synthesise organic compounds from inorganic materials. Animals are heterotrophs and obtain ready-made food.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b9-nut-02",
    subjectId: "biology",
    topic: "Nutrition in plants & animals",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "Which nutrient is the main source of energy for most animals? [1 mark]",
    choices: ["Vitamins", "Minerals", "Carbohydrates", "Water"],
    correctAnswer: "2",
    explanation:
      "Carbohydrates (e.g. glucose, starch) are the primary energy source. Vitamins and minerals are needed in small amounts for other roles.",
    marks: 1,
    tags: ["exam-style"],
    promptAr: "أي مُغذٍّ يُعد المصدر الرئيسي للطاقة لمعظم الحيوانات؟ [1 mark]",
    choicesAr: ["الفيتامينات", "المعادن", "الكربوهيدرات", "الماء"],
    explanationAr: "الكربوهيدرات هي المصدر الأساسي للطاقة.",
  },
  {
    id: "b9-hds-01",
    subjectId: "biology",
    topic: "Human digestive system intro",
    grade: 9,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Where does chemical digestion of starch begin in humans? [1 mark]",
    choices: ["Stomach", "Mouth", "Small intestine", "Large intestine"],
    correctAnswer: "1",
    explanation:
      "Salivary amylase in the mouth begins breaking starch into maltose. Protein digestion begins in the stomach.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b9-hds-02",
    subjectId: "biology",
    topic: "Human digestive system intro",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "short",
    prompt:
      "Name the enzyme that digests protein in the stomach. [1 mark]",
    correctAnswer: "pepsin|protease (pepsin)",
    explanation:
      "Pepsin (a protease) digests proteins into peptides in the acidic conditions of the stomach.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b9-eco-01",
    subjectId: "biology",
    topic: "Ecosystems & habitats",
    grade: 9,
    stage: "basic",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "A habitat is best described as: [1 mark]",
    choices: [
      "All living organisms on Earth",
      "The place where an organism lives",
      "A feeding relationship only",
      "Energy lost as heat",
    ],
    correctAnswer: "1",
    explanation:
      "A habitat is the place where an organism lives. An ecosystem includes living organisms interacting with each other and their non-living environment.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b9-eco-02",
    subjectId: "biology",
    topic: "Ecosystems & habitats",
    grade: 9,
    stage: "basic",
    difficulty: "hard",
    type: "structured",
    prompt:
      "In a simple food chain: grass → grasshopper → lizard → hawk.\n(a) Identify the producer. [1 mark]\n(b) Explain why energy decreases along the food chain. [2 marks]",
    correctAnswer:
      "(a) grass; (b) energy lost as heat / used in respiration / not all biomass eaten or digested",
    explanation:
      "(a) Grass is the producer (photosynthesis). (b) Award marks for heat loss from respiration, incomplete consumption, or egestion — typically only ~10% transfers to the next trophic level.",
    marks: 3,
    tags: ["exam-style"],
    promptAr:
      "في سلسلة غذائية: عشب → جندب → سحلية → صقر.\n(أ) حدّد المنتج. [1 mark]\n(ب) فسّر لماذا تتناقص الطاقة على طول السلسلة الغذائية. [2 marks]",
    explanationAr:
      "(أ) العشب منتج. (ب) تُفقد الطاقة كحرارة / في التنفس / لا يُستهلك كل الكتلة الحيوية.",
  },
  {
    id: "b9-cls-01",
    subjectId: "biology",
    topic: "Classification",
    grade: 9,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Which kingdom includes organisms that are usually multicellular, eukaryotic, and obtain food by photosynthesis? [1 mark]",
    choices: ["Animalia", "Fungi", "Plantae", "Bacteria"],
    correctAnswer: "2",
    explanation:
      "Kingdom Plantae contains photosynthetic multicellular eukaryotes. Fungi are heterotrophic; bacteria are prokaryotic.",
    marks: 1,
    tags: ["exam-style"],
  },

  // ── Grade 10 (basic) ─────────────────────────────────────────────
  {
    id: "b10-resp-01",
    subjectId: "biology",
    topic: "Respiration",
    grade: 10,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "The word equation for aerobic respiration in animals is: [1 mark]",
    choices: [
      "glucose → lactic acid + energy",
      "glucose + oxygen → carbon dioxide + water + energy",
      "carbon dioxide + water → glucose + oxygen",
      "glucose → ethanol + carbon dioxide + energy",
    ],
    correctAnswer: "1",
    explanation:
      "Aerobic respiration: glucose + oxygen → CO₂ + H₂O + energy (ATP). Anaerobic paths produce lactic acid (animals) or ethanol + CO₂ (yeast).",
    marks: 1,
    tags: ["exam-style"],
    promptAr: "المعادلة اللفظية للتنفس الهوائي في الحيوانات هي: [1 mark]",
    choicesAr: [
      "جلوكوز → حمض لبني + طاقة",
      "جلوكوز + أكسجين → ثاني أكسيد الكربون + ماء + طاقة",
      "ثاني أكسيد الكربون + ماء → جلوكوز + أكسجين",
      "جلوكوز → إيثانول + ثاني أكسيد الكربون + طاقة",
    ],
    explanationAr: "التنفس الهوائي: جلوكوز + أكسجين → CO₂ + ماء + طاقة.",
  },
  {
    id: "b10-resp-02",
    subjectId: "biology",
    topic: "Respiration",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "short",
    prompt:
      "State one difference between aerobic and anaerobic respiration in human muscle. [2 marks]",
    correctAnswer:
      "aerobic uses oxygen / produces more ATP / products CO2 and water; anaerobic no oxygen / less ATP / lactic acid",
    explanation:
      "Accept any valid contrast: oxygen requirement, relative ATP yield, or end products (CO₂ + water vs lactic acid).",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "b10-circ-01",
    subjectId: "biology",
    topic: "Circulation & transport",
    grade: 10,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Which blood vessel carries oxygenated blood from the lungs to the left atrium? [1 mark]",
    choices: ["Pulmonary artery", "Pulmonary vein", "Aorta", "Vena cava"],
    correctAnswer: "1",
    explanation:
      "Pulmonary veins return oxygenated blood to the left atrium. The pulmonary artery carries deoxygenated blood to the lungs.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b10-circ-02",
    subjectId: "biology",
    topic: "Circulation & transport",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "structured",
    prompt:
      "Explain why arteries have thicker muscular walls than veins. [2 marks]",
    correctAnswer:
      "arteries carry blood at higher pressure from the heart; thicker walls withstand / maintain pressure",
    explanation:
      "Arterial blood is under high pressure from ventricular contraction; thick elastic/muscular walls resist this pressure and help maintain flow.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "b10-repr-01",
    subjectId: "biology",
    topic: "Reproduction basics",
    grade: 10,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Sexual reproduction involves: [1 mark]",
    choices: [
      "One parent only and identical offspring",
      "Fusion of gametes producing genetic variation",
      "Binary fission only",
      "Budding without nuclei",
    ],
    correctAnswer: "1",
    explanation:
      "Sexual reproduction combines genetic material from two gametes (fertilisation), producing offspring that vary from the parents.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b10-repr-02",
    subjectId: "biology",
    topic: "Reproduction basics",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "short",
    prompt:
      "Name the male and female gametes in flowering plants. [2 marks]",
    correctAnswer: "pollen (grain)/sperm nucleus and ovule/egg cell|pollen and ovule",
    explanation:
      "Male gametes are in pollen grains; the female gamete is the egg cell within the ovule.",
    marks: 2,
    tags: ["exam-style"],
    promptAr: "سمِّ الأمشاج الذكرية والأنثوية في النباتات الزهرية. [2 marks]",
    explanationAr: "الذكر: حبوب اللقاح؛ الأنثى: البويضة داخل البويضة النباتية (ovule).",
  },
  {
    id: "b10-mic-01",
    subjectId: "biology",
    topic: "Microorganisms & disease",
    grade: 10,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Antibiotics are effective against: [1 mark]",
    choices: [
      "All viruses",
      "Bacterial infections (typically)",
      "Genetic disorders",
      "All toxins",
    ],
    correctAnswer: "1",
    explanation:
      "Antibiotics target bacterial processes (e.g. cell wall synthesis). They do not work against viruses.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b10-mic-02",
    subjectId: "biology",
    topic: "Microorganisms & disease",
    grade: 10,
    stage: "basic",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Explain one way white blood cells help defend the body against pathogens. [2 marks]",
    correctAnswer:
      "phagocytosis / engulf and digest pathogens; OR produce antibodies that bind antigens",
    explanation:
      "Accept phagocytosis (engulfing pathogens) or antibody production that marks/neutralises pathogens. Award detail for full marks.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "b10-photo-01",
    subjectId: "biology",
    topic: "Photosynthesis",
    grade: 10,
    stage: "basic",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "The green pigment that absorbs light for photosynthesis is: [1 mark]",
    choices: ["Haemoglobin", "Chlorophyll", "Keratin", "Melanin"],
    correctAnswer: "1",
    explanation:
      "Chlorophyll in chloroplasts absorbs light energy used to drive photosynthesis.",
    marks: 1,
    tags: ["exam-style"],
    promptAr: "الصبغة الخضراء التي تمتص الضوء لعملية البناء الضوئي هي: [1 mark]",
    choicesAr: ["الهيموغلوبين", "الكلوروفيل", "الكيراتين", "الميلانين"],
    explanationAr: "الكلوروفيل يمتص طاقة الضوء اللازمة للبناء الضوئي.",
  },
  {
    id: "b10-photo-02",
    subjectId: "biology",
    topic: "Photosynthesis",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "short",
    prompt:
      "Write the word equation for photosynthesis. [2 marks]",
    correctAnswer:
      "carbon dioxide + water → glucose + oxygen|CO2 + H2O → glucose + O2 (light/chlorophyll)",
    explanation:
      "Carbon dioxide + water → glucose + oxygen, in the presence of light and chlorophyll. Light energy is required.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "b10-imp-01",
    subjectId: "biology",
    topic: "Human impact on environment",
    grade: 10,
    stage: "basic",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "Deforestation mainly contributes to climate change because it: [1 mark]",
    choices: [
      "Increases oxygen production only",
      "Reduces CO₂ absorption by plants and may release stored carbon",
      "Stops all rainfall permanently",
      "Creates only new habitats for all species",
    ],
    correctAnswer: "1",
    explanation:
      "Fewer trees mean less CO₂ uptake by photosynthesis; burning/decay of biomass can release stored carbon, enhancing the greenhouse effect.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b10-imp-02",
    subjectId: "biology",
    topic: "Human impact on environment",
    grade: 10,
    stage: "basic",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Describe one human activity that pollutes water and explain one effect on aquatic organisms. [3 marks]",
    correctAnswer:
      "e.g. untreated sewage / fertiliser runoff / oil spills — causes eutrophication / oxygen depletion / toxicity / death of fish",
    explanation:
      "Award 1 mark for a named activity and up to 2 marks for a linked effect (e.g. nutrient runoff → algal bloom → oxygen depletion → fish death).",
    marks: 3,
    tags: ["exam-style"],
  },

  // ── Grade 11 (ged) ───────────────────────────────────────────────
  {
    id: "b11-cell-01",
    subjectId: "biology",
    topic: "Cell structure",
    grade: 11,
    stage: "ged",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Which structure is present in prokaryotic cells but not as a true membrane-bound organelle system like eukaryotes? [1 mark]",
    choices: [
      "Nucleus with nuclear envelope",
      "Circular DNA in a nucleoid region (no true nucleus)",
      "Mitochondria with cristae",
      "Chloroplasts with thylakoids",
    ],
    correctAnswer: "1",
    explanation:
      "Prokaryotes lack a true nucleus and membrane-bound organelles; their DNA lies in a nucleoid region.",
    marks: 1,
    tags: ["exam-style"],
    promptAr:
      "أي تركيب يوجد في الخلايا بدائية النواة دون نواة حقيقية محاطة بغشاء؟ [1 mark]",
    choicesAr: [
      "نواة بغلاف نووي",
      "DNA حلقي في منطقة نووية (بدون نواة حقيقية)",
      "ميتوكوندريا بأعراف",
      "بلاستيدات خضراء بأغشية ثايلاكويد",
    ],
    explanationAr: "بدائيات النواة تفتقر إلى نواة حقيقية وعضيات محاطة بغشاء.",
  },
  {
    id: "b11-cell-02",
    subjectId: "biology",
    topic: "Cell structure",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "short",
    prompt:
      "State the function of ribosomes. [1 mark]",
    correctAnswer: "protein synthesis|make proteins|translate mRNA into polypeptides",
    explanation:
      "Ribosomes synthesise proteins by translating mRNA into polypeptide chains.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b11-cell-03",
    subjectId: "biology",
    topic: "Cell structure",
    grade: 11,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Compare the roles of the rough endoplasmic reticulum and the Golgi apparatus in protein processing. [3 marks]",
    correctAnswer:
      "RER: ribosomes synthesise proteins / proteins enter RER lumen for folding/modification; Golgi: modifies, sorts and packages proteins into vesicles for secretion or use",
    explanation:
      "Award marks for RER (synthesis/modification linked to ribosomes) and Golgi (modification, sorting, packaging/export).",
    marks: 3,
    tags: ["exam-style"],
  },
  {
    id: "b11-div-01",
    subjectId: "biology",
    topic: "Cell division",
    grade: 11,
    stage: "ged",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Mitosis produces: [1 mark]",
    choices: [
      "Four genetically different haploid cells",
      "Two genetically identical diploid cells (in diploid organisms)",
      "One diploid and one haploid cell",
      "Only gametes",
    ],
    correctAnswer: "1",
    explanation:
      "Mitosis yields two daughter cells genetically identical to the parent (same chromosome number). Meiosis produces haploid gametes with variation.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b11-div-02",
    subjectId: "biology",
    topic: "Cell division",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "During which stage of mitosis do sister chromatids separate and move to opposite poles? [1 mark]",
    choices: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
    correctAnswer: "2",
    explanation:
      "In anaphase, centromeres split and sister chromatids are pulled apart to opposite poles.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b11-gen-01",
    subjectId: "biology",
    topic: "Genetics basics",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "If allele T (tall) is dominant to t (short), the genotype of a heterozygous tall plant is: [1 mark]",
    choices: ["TT", "Tt", "tt", "T only"],
    correctAnswer: "1",
    explanation:
      "Heterozygous means two different alleles: Tt. Phenotype is tall because T is dominant.",
    marks: 1,
    tags: ["exam-style"],
    promptAr:
      "إذا كان الأليل T (طويل) سائداً على t (قصير)، فإن الطراز الجيني لنبات طويل متغاير الزيجوت هو: [1 mark]",
    choicesAr: ["TT", "Tt", "tt", "T فقط"],
    explanationAr: "متغاير الزيجوت يعني أليلين مختلفين: Tt.",
  },
  {
    id: "b11-gen-02",
    subjectId: "biology",
    topic: "Genetics basics",
    grade: 11,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "In pea plants, yellow seeds (Y) are dominant to green (y). Two heterozygous yellow plants are crossed.\n(a) Draw or state the Punnett square genotypes. [2 marks]\n(b) State the phenotypic ratio of offspring. [1 mark]",
    correctAnswer: "(a) YY, Yy, Yy, yy; (b) 3 yellow : 1 green",
    explanation:
      "Yy × Yy → YY, Yy, Yy, yy. Phenotypes: 3 yellow : 1 green.",
    marks: 3,
    tags: ["exam-style"],
  },
  {
    id: "b11-hds-01",
    subjectId: "biology",
    topic: "Human digestive system",
    grade: 11,
    stage: "ged",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Most absorption of digested nutrients occurs in the: [1 mark]",
    choices: ["Stomach", "Large intestine", "Small intestine (ileum)", "Oesophagus"],
    correctAnswer: "2",
    explanation:
      "The small intestine (especially ileum) has villi/microvilli that greatly increase surface area for absorption.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b11-hds-02",
    subjectId: "biology",
    topic: "Human digestive system",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "short",
    prompt:
      "Explain how villi are adapted for absorption. Give two adaptations. [2 marks]",
    correctAnswer:
      "large surface area / microvilli; thin epithelium; rich blood/capillary network; lacteals for fats",
    explanation:
      "Any two: folded villi + microvilli (area); one-cell-thick epithelium (short diffusion path); dense capillaries; lacteals for fatty products.",
    marks: 2,
    tags: ["exam-style"],
  },
  {
    id: "b11-eco-01",
    subjectId: "biology",
    topic: "Ecology & environment",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "In an ecosystem, a niche refers to: [1 mark]",
    choices: [
      "Only the physical place an organism sits",
      "The role of an organism including how it obtains resources and interacts",
      "The total number of species only",
      "Energy units in joules only",
    ],
    correctAnswer: "1",
    explanation:
      "A niche is an organism’s ecological role — resources used, interactions, and conditions tolerated — not merely its location (habitat).",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b11-photo-01",
    subjectId: "biology",
    topic: "Photosynthesis",
    grade: 11,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "A limiting factor for photosynthesis on a cloudy day is most likely: [1 mark]",
    choices: ["Light intensity", "Soil nitrogen only", "Blood oxygen", "Sound level"],
    correctAnswer: "0",
    explanation:
      "Low light intensity on cloudy days commonly limits the rate of photosynthesis when other factors are adequate.",
    marks: 1,
    tags: ["exam-style"],
    promptAr: "عامل مُحدِّد للبناء الضوئي في يوم غائم على الأرجح هو: [1 mark]",
    choicesAr: ["شدة الضوء", "نيتروجين التربة فقط", "أكسجين الدم", "مستوى الصوت"],
    explanationAr: "انخفاض شدة الضوء يحدّ غالباً من معدل البناء الضوئي.",
  },
  {
    id: "b11-photo-02",
    subjectId: "biology",
    topic: "Photosynthesis",
    grade: 11,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Explain how increasing CO₂ concentration can increase the rate of photosynthesis up to a point, and why the rate then levels off. [3 marks]",
    correctAnswer:
      "more CO₂ substrate for Calvin cycle / carbon fixation increases rate; then another factor (light, temperature, enzyme saturation) becomes limiting so rate plateaus",
    explanation:
      "CO₂ is a reactant; more CO₂ raises rate until another limiting factor or enzyme saturation prevents further increase.",
    marks: 3,
    tags: ["exam-style"],
  },

  // ── Grade 12 (ged) ───────────────────────────────────────────────
  {
    id: "b12-inh-01",
    subjectId: "biology",
    topic: "Inheritance & variation",
    grade: 12,
    stage: "ged",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Continuous variation (e.g. human height) is typically influenced by: [1 mark]",
    choices: [
      "A single gene with no environment effect",
      "Many genes and often environmental factors",
      "Only mutation in one base",
      "Chromosome number alone",
    ],
    correctAnswer: "1",
    explanation:
      "Continuous traits are usually polygenic and modified by environment (nutrition, etc.), producing a range of phenotypes.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b12-inh-02",
    subjectId: "biology",
    topic: "Inheritance & variation",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Distinguish between genotype and phenotype, using one example. [3 marks]",
    correctAnswer:
      "genotype = genetic makeup (alleles); phenotype = observable characteristics; e.g. Tt genotype → tall phenotype",
    explanation:
      "1 mark genotype definition, 1 mark phenotype definition, 1 mark linked example.",
    marks: 3,
    tags: ["exam-style"],
    promptAr: "ميّز بين الطراز الجيني والطراز الشكلي بمثال واحد. [3 marks]",
    explanationAr:
      "الجيني: التركيب الأليلي؛ الشكلي: الصفات الظاهرة؛ مثال Tt → طويل.",
  },
  {
    id: "b12-homeo-01",
    subjectId: "biology",
    topic: "Homeostasis",
    grade: 12,
    stage: "ged",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Homeostasis means: [1 mark]",
    choices: [
      "Uncontrolled change of the internal environment",
      "Maintenance of a stable internal environment despite external changes",
      "Only digestion of food",
      "Production of gametes",
    ],
    correctAnswer: "1",
    explanation:
      "Homeostasis keeps internal conditions (e.g. temperature, blood glucose, water balance) within narrow limits.",
    marks: 1,
    tags: ["exam-style"],
    promptAr: "الاتزان الداخلي (الهوميوستاسيس) يعني: [1 mark]",
    choicesAr: [
      "تغير غير مضبوط للبيئة الداخلية",
      "المحافظة على بيئة داخلية مستقرة رغم التغيرات الخارجية",
      "هضم الطعام فقط",
      "إنتاج الأمشاج",
    ],
    explanationAr: "الهوميوستاسيس يحافظ على ثبات الظروف الداخلية ضمن حدود ضيقة.",
  },
  {
    id: "b12-homeo-02",
    subjectId: "biology",
    topic: "Homeostasis",
    grade: 12,
    stage: "ged",
    difficulty: "medium",
    type: "short",
    prompt:
      "Name the hormone that lowers blood glucose concentration after a meal. [1 mark]",
    correctAnswer: "insulin",
    explanation:
      "Insulin from the pancreas promotes glucose uptake into cells and storage as glycogen, lowering blood glucose.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b12-homeo-03",
    subjectId: "biology",
    topic: "Homeostasis",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Describe the role of negative feedback in controlling body temperature when a person becomes too hot. [3 marks]",
    correctAnswer:
      "receptors detect rise; hypothalamus coordinates; responses e.g. sweating / vasodilation cool body; temperature returns toward set point (negative feedback)",
    explanation:
      "Marks for detection, coordinated response that opposes the change (sweating/vasodilation), and return toward normal (negative feedback concept).",
    marks: 3,
    tags: ["exam-style"],
  },
  {
    id: "b12-nerv-01",
    subjectId: "biology",
    topic: "Nervous & hormonal control",
    grade: 12,
    stage: "ged",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Compared with hormonal control, nervous control is generally: [1 mark]",
    choices: [
      "Slower and longer-lasting",
      "Faster and more short-lived",
      "Always via the bloodstream only",
      "Unable to involve the brain",
    ],
    correctAnswer: "1",
    explanation:
      "Nerve impulses travel rapidly along neurones for short-lived, precise responses; hormones act more slowly via blood and often last longer.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b12-nerv-02",
    subjectId: "biology",
    topic: "Nervous & hormonal control",
    grade: 12,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "In a reflex arc, the correct sequence is: [1 mark]",
    choices: [
      "Effector → motor neurone → CNS → sensory neurone → receptor",
      "Receptor → sensory neurone → CNS → motor neurone → effector",
      "CNS → receptor → effector → sensory neurone",
      "Motor neurone → receptor → sensory neurone → effector",
    ],
    correctAnswer: "1",
    explanation:
      "Stimulus detected by receptor → sensory neurone → CNS (relay) → motor neurone → effector (muscle/gland).",
    marks: 1,
    tags: ["exam-style"],
    promptAr: "في القوس الانعكاسي، الترتيب الصحيح هو: [1 mark]",
    choicesAr: [
      "منفّذ → عصبون حركي → الجهاز العصبي المركزي → عصبون حسي → مستقبل",
      "مستقبل → عصبون حسي → الجهاز العصبي المركزي → عصبون حركي → منفّذ",
      "الجهاز العصبي المركزي → مستقبل → منفّذ → عصبون حسي",
      "عصبون حركي → مستقبل → عصبون حسي → منفّذ",
    ],
    explanationAr: "مستقبل → حسي → CNS → حركي → منفّذ.",
  },
  {
    id: "b12-bio-01",
    subjectId: "biology",
    topic: "Biotechnology intro",
    grade: 12,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "One common use of enzymes in biotechnology is: [1 mark]",
    choices: [
      "Biological washing powders that digest stains",
      "Replacing all human organs permanently without testing",
      "Stopping photosynthesis in crops",
      "Eliminating the need for DNA",
    ],
    correctAnswer: "0",
    explanation:
      "Industrial enzymes (proteases, lipases, amylases) in detergents break down protein, fat, and starch stains at moderate temperatures.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b12-bio-02",
    subjectId: "biology",
    topic: "Biotechnology intro",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Explain briefly what genetic engineering is and give one example of its application. [3 marks]",
    correctAnswer:
      "transfer/modification of genes between organisms / recombinant DNA; e.g. insulin-producing bacteria / GM crops with pest resistance",
    explanation:
      "1–2 marks for idea of altering/transferring genes; 1 mark for a valid application (insulin, GM crops, gene therapy context at intro level).",
    marks: 3,
    tags: ["exam-style"],
  },
  {
    id: "b12-biod-01",
    subjectId: "biology",
    topic: "Biodiversity & conservation",
    grade: 12,
    stage: "ged",
    difficulty: "easy",
    type: "mcq",
    prompt:
      "Biodiversity refers to: [1 mark]",
    choices: [
      "Only the number of rocks in a habitat",
      "Variety of living organisms and ecosystems",
      "A single clone of one species",
      "Energy loss in food chains only",
    ],
    correctAnswer: "1",
    explanation:
      "Biodiversity is the variety of life — species diversity, genetic diversity, and ecosystem diversity.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b12-biod-02",
    subjectId: "biology",
    topic: "Biodiversity & conservation",
    grade: 12,
    stage: "ged",
    difficulty: "medium",
    type: "short",
    prompt:
      "State two reasons why conserving biodiversity is important. [2 marks]",
    correctAnswer:
      "ecosystem stability / food security / medicines / ethical/cultural value / tourism / climate regulation",
    explanation:
      "Accept any two valid reasons: ecological stability, resources (food, medicines), ethics, economy, or environmental services.",
    marks: 2,
    tags: ["exam-style"],
    promptAr: "اذكر سببين لأهمية حفظ التنوع الحيوي. [2 marks]",
    explanationAr:
      "استقرار النظم البيئية / الأمن الغذائي / أدوية / قيم أخلاقية / سياحة / تنظيم المناخ.",
  },
  {
    id: "b12-exp-01",
    subjectId: "biology",
    topic: "Experimental biology skills",
    grade: 12,
    stage: "ged",
    difficulty: "medium",
    type: "mcq",
    prompt:
      "In an investigation, a control is used to: [1 mark]",
    choices: [
      "Make the experiment more colourful",
      "Provide a baseline for comparison so the effect of the independent variable can be judged",
      "Remove the need for repeats",
      "Always prove a hypothesis true",
    ],
    correctAnswer: "1",
    explanation:
      "A control lacks the experimental treatment (or holds conditions constant) so results can be compared fairly.",
    marks: 1,
    tags: ["exam-style"],
  },
  {
    id: "b12-exp-02",
    subjectId: "biology",
    topic: "Experimental biology skills",
    grade: 12,
    stage: "ged",
    difficulty: "hard",
    type: "structured",
    prompt:
      "Students investigate the effect of light intensity on the rate of photosynthesis using pondweed and counting bubbles of gas.\n(a) Identify the independent variable. [1 mark]\n(b) Identify one dependent variable. [1 mark]\n(c) State one variable that should be controlled and why. [2 marks]",
    correctAnswer:
      "(a) light intensity; (b) rate/number of bubbles (or volume of O2) per unit time; (c) e.g. temperature / CO2 / species — to ensure a fair test so only light intensity affects the rate",
    explanation:
      "Independent = deliberately changed (light). Dependent = measured (bubble rate). Controlled factor must be named with a fair-test reason.",
    marks: 4,
    tags: ["exam-style"],
  },
];
