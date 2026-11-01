import type { TopicLesson } from "./types";
import { MATH_G9_LESSONS } from "./math-g9-lessons";

/** Curated YouTube-backed lessons for Mathematics (Oman MoE Grades 9–12).
 *  Grade 9 topics are fully bilingual — see math-g9-lessons.ts
 */
export const MATH_LESSONS: TopicLesson[] = [
  ...MATH_G9_LESSONS,
  {
    subjectId: "math",
    topic: "Quadratic expressions",
    summary:
      "Expand and factor quadratic expressions, recognise standard form ax² + bx + c, and connect factoring to roots.",
    objectives: [
      "Expand (x + a)(x + b)",
      "Factor simple quadratics",
      "Identify coefficients a, b, c",
    ],
    keyPoints: [
      "(x + a)(x + b) = x² + (a+b)x + ab.",
      "Factoring undoes expanding.",
      "If (x − r) is a factor, x = r is a root of the equation = 0.",
    ],
    videos: [
      {
        youtubeId: "u1SAo2GiX8A",
        title: "Factoring quadratics",
        channel: "Khan Academy",
        durationLabel: "10 min",
      },
      {
        youtubeId: "i7idZfS8t8w",
        title: "Quadratic formula",
        channel: "Khan Academy",
        durationLabel: "12 min",
      },
    ],
    practice: [
      {
        id: "qe-1",
        prompt: "Expand (x + 3)(x + 2)",
        choices: ["x² + 5x + 6", "x² + 6x + 5", "x² + 5", "2x + 5"],
        correctIndex: 0,
        explanation: "x² + 2x + 3x + 6 = x² + 5x + 6.",
      },
      {
        id: "qe-2",
        prompt: "Factor x² + 5x + 6",
        choices: ["(x+1)(x+6)", "(x+2)(x+3)", "(x+5)(x+1)", "(x−2)(x−3)"],
        correctIndex: 1,
        explanation: "2 and 3 multiply to 6 and add to 5.",
      },
      {
        id: "qe-3",
        prompt: "In 2x² − 3x + 1, coefficient b is:",
        choices: ["2", "−3", "1", "−1"],
        correctIndex: 1,
        explanation: "Standard form ax² + bx + c → b = −3.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Simultaneous equations",
    summary:
      "Solve two linear equations together using substitution or elimination — a core Grade 10 skill.",
    objectives: [
      "Solve by substitution",
      "Solve by elimination",
      "Interpret the intersection of two lines",
    ],
    keyPoints: [
      "A solution (x, y) satisfies both equations.",
      "Elimination: make one coefficient match, then add/subtract.",
      "Graphically, the solution is where the lines meet.",
    ],
    videos: [
      {
        youtubeId: "V7H1oUHXPkg",
        title: "Solving systems by substitution",
        channel: "Khan Academy",
        durationLabel: "9 min",
      },
      {
        youtubeId: "V7H1oUHXPkg",
        title: "Solving systems by elimination",
        channel: "Khan Academy",
        durationLabel: "10 min",
      },
    ],
    practice: [
      {
        id: "se-1",
        prompt: "If x + y = 10 and x − y = 2, then x =",
        choices: ["4", "6", "8", "5"],
        correctIndex: 1,
        explanation: "Add: 2x = 12 → x = 6.",
      },
      {
        id: "se-2",
        prompt: "If y = 2x and x + y = 9, then x =",
        choices: ["3", "2", "9", "6"],
        correctIndex: 0,
        explanation: "x + 2x = 9 → 3x = 9 → x = 3.",
      },
      {
        id: "se-3",
        prompt: "Two distinct intersecting lines have how many solutions?",
        choices: ["0", "1", "2", "Infinitely many"],
        correctIndex: 1,
        explanation: "They meet at exactly one point.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Pythagoras theorem",
    summary:
      "Use a² + b² = c² in right triangles to find missing sides and check whether a triangle is right-angled.",
    objectives: [
      "Identify the hypotenuse",
      "Find a missing side",
      "Apply Pythagoras in word problems",
    ],
    keyPoints: [
      "c is always the longest side, opposite the right angle.",
      "a² + b² = c² only for right triangles.",
      "To find a leg: a = √(c² − b²).",
    ],
    videos: [
      {
        youtubeId: "AA6RfgP-AHU",
        title: "Intro to the Pythagorean theorem",
        channel: "Khan Academy",
        durationLabel: "10 min",
      },
    ],
    practice: [
      {
        id: "pt-1",
        prompt: "Legs 3 and 4; hypotenuse =",
        choices: ["5", "6", "7", "12"],
        correctIndex: 0,
        explanation: "3² + 4² = 9 + 16 = 25 → √25 = 5.",
      },
      {
        id: "pt-2",
        prompt: "Hypotenuse 13, one leg 5; other leg =",
        choices: ["8", "12", "18", "144"],
        correctIndex: 1,
        explanation: "√(13² − 5²) = √(169 − 25) = √144 = 12.",
      },
      {
        id: "pt-3",
        prompt: "Does 5, 12, 13 form a right triangle?",
        choices: ["Yes", "No", "Only if isosceles", "Cannot tell"],
        correctIndex: 0,
        explanation: "5² + 12² = 25 + 144 = 169 = 13².",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Trigonometry of right triangles",
    summary:
      "Use SOH-CAH-TOA to find missing sides and angles in right triangles.",
    objectives: [
      "Define sin, cos, tan for acute angles",
      "Find a side given an angle",
      "Find an angle given two sides",
    ],
    keyPoints: [
      "sin θ = opposite / hypotenuse",
      "cos θ = adjacent / hypotenuse",
      "tan θ = opposite / adjacent",
    ],
    videos: [
      {
        youtubeId: "Jsiy4TxgIME",
        title: "Intro to trigonometric ratios",
        channel: "Khan Academy",
        durationLabel: "9 min",
      },
      {
        youtubeId: "Jsiy4TxgIME",
        title: "Using trig to find a side",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
    ],
    practice: [
      {
        id: "trt-1",
        prompt: "In a right triangle, sin θ = opposite / ?",
        choices: ["Adjacent", "Hypotenuse", "Opposite", "tan θ"],
        correctIndex: 1,
        explanation: "SOH: sine = opposite / hypotenuse.",
      },
      {
        id: "trt-2",
        prompt: "If opposite = 3 and adjacent = 4, tan θ =",
        choices: ["3/4", "4/3", "3/5", "5/3"],
        correctIndex: 0,
        explanation: "tan = opp/adj = 3/4.",
      },
      {
        id: "trt-3",
        prompt: "cos 0° equals:",
        choices: ["0", "1", "−1", "1/2"],
        correctIndex: 1,
        explanation: "cos 0° = 1.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Coordinate geometry",
    summary:
      "Find midpoint, distance, and equation of a straight line from two points.",
    objectives: [
      "Use the distance formula",
      "Find the midpoint",
      "Write y = mx + c from two points",
    ],
    keyPoints: [
      "Distance = √[(x₂−x₁)² + (y₂−y₁)²]",
      "Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2)",
      "Gradient m = (y₂−y₁)/(x₂−x₁)",
    ],
    videos: [
      {
        youtubeId: "nyZuite17Pc",
        title: "Distance formula",
        channel: "Khan Academy",
        durationLabel: "7 min",
      },
      {
        youtubeId: "R948Tsyq4vA",
        title: "Slope between two points",
        channel: "Khan Academy",
        durationLabel: "9 min",
      },
    ],
    practice: [
      {
        id: "cg-1",
        prompt: "Distance from (0,0) to (3,4):",
        choices: ["5", "7", "12", "25"],
        correctIndex: 0,
        explanation: "√(9+16) = 5.",
      },
      {
        id: "cg-2",
        prompt: "Midpoint of (2,4) and (6,8):",
        choices: ["(4,6)", "(8,12)", "(2,2)", "(4,4)"],
        correctIndex: 0,
        explanation: "((2+6)/2, (4+8)/2) = (4, 6).",
      },
      {
        id: "cg-3",
        prompt: "Slope from (1,2) to (3,6):",
        choices: ["1", "2", "3", "4"],
        correctIndex: 1,
        explanation: "(6−2)/(3−1) = 4/2 = 2.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Sequences & patterns",
    summary:
      "Recognise arithmetic and simple geometric sequences and find the nth term.",
    objectives: [
      "Find the common difference or ratio",
      "Write the nth term of an arithmetic sequence",
      "Continue a number pattern",
    ],
    keyPoints: [
      "Arithmetic: each term adds a constant d.",
      "nth term (arithmetic): aₙ = a₁ + (n−1)d",
      "Geometric: each term multiplies by a constant r.",
    ],
    videos: [
      {
        youtubeId: "_cooC3yG_p0",
        title: "Intro to arithmetic sequences",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
    ],
    practice: [
      {
        id: "sp-1",
        prompt: "Next term in 3, 7, 11, 15, …",
        choices: ["17", "18", "19", "20"],
        correctIndex: 2,
        explanation: "Common difference +4 → 15 + 4 = 19.",
      },
      {
        id: "sp-2",
        prompt: "nth term of 2, 5, 8, 11, …",
        choices: ["3n − 1", "2n + 1", "n + 2", "3n + 2"],
        correctIndex: 0,
        explanation: "a₁ = 2, d = 3 → 2 + (n−1)3 = 3n − 1.",
      },
      {
        id: "sp-3",
        prompt: "Common ratio of 2, 6, 18, 54:",
        choices: ["2", "3", "4", "6"],
        correctIndex: 1,
        explanation: "Each term × 3.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Probability basics",
    summary:
      "Find simple probabilities, use sample spaces, and apply P(A) = favourable / total outcomes.",
    objectives: [
      "Calculate single-event probability",
      "Use complementary events",
      "List outcomes for simple experiments",
    ],
    keyPoints: [
      "0 ≤ P ≤ 1",
      "P(not A) = 1 − P(A)",
      "Assume equally likely outcomes unless told otherwise.",
    ],
    videos: [
      {
        youtubeId: "uzkc-qNVoOk",
        title: "Intro to probability",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
    ],
    practice: [
      {
        id: "pb-1",
        prompt: "P(rolling a 4 on a fair die) =",
        choices: ["1/2", "1/6", "1/3", "4/6"],
        correctIndex: 1,
        explanation: "One favourable outcome out of six.",
      },
      {
        id: "pb-2",
        prompt: "P(not getting heads on a fair coin) =",
        choices: ["0", "1/4", "1/2", "1"],
        correctIndex: 2,
        explanation: "Complement of heads is tails → 1/2.",
      },
      {
        id: "pb-3",
        prompt: "A bag has 3 red and 2 blue. P(red) =",
        choices: ["2/5", "3/5", "3/2", "1/3"],
        correctIndex: 1,
        explanation: "3 red out of 5 balls.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Transformations of shapes",
    summary:
      "Describe translations, reflections, rotations, and enlargements on the coordinate plane.",
    objectives: [
      "Translate a shape by a vector",
      "Reflect in x-axis, y-axis, or a line",
      "Rotate about a point",
    ],
    keyPoints: [
      "Translation slides without turning.",
      "Reflection flips; distance to the mirror is preserved.",
      "Rotation turns about a centre by a given angle.",
    ],
    videos: [
      {
        youtubeId: "XiAoUDfrar0",
        title: "Translations, reflections, rotations",
        channel: "Khan Academy",
        durationLabel: "10 min",
      },
    ],
    practice: [
      {
        id: "ts-1",
        prompt: "Reflect (3, 2) in the x-axis:",
        choices: ["(−3, 2)", "(3, −2)", "(−3, −2)", "(2, 3)"],
        correctIndex: 1,
        explanation: "x stays, y changes sign → (3, −2).",
      },
      {
        id: "ts-2",
        prompt: "Translate (1, 4) by (2, −3):",
        choices: ["(3, 1)", "(−1, 7)", "(2, −3)", "(1, 1)"],
        correctIndex: 0,
        explanation: "(1+2, 4−3) = (3, 1).",
      },
      {
        id: "ts-3",
        prompt: "A 180° rotation about origin sends (2, 5) to:",
        choices: ["(−2, −5)", "(−2, 5)", "(2, −5)", "(5, 2)"],
        correctIndex: 0,
        explanation: "180° about origin: (x, y) → (−x, −y).",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Functions & graphs",
    summary:
      "Understand function notation f(x), domain/range ideas, and sketch common function graphs.",
    objectives: [
      "Evaluate f(x) for given inputs",
      "Read graphs of functions",
      "Distinguish linear vs quadratic shapes",
    ],
    keyPoints: [
      "f(a) means substitute x = a into the rule.",
      "A function gives exactly one output per input.",
      "Linear graphs are straight; quadratics are parabolas.",
    ],
    videos: [
      {
        youtubeId: "kvGsIo1TmsM",
        title: "What is a function?",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
      {
        youtubeId: "kvGsIo1TmsM",
        title: "Recognising functions from graphs",
        channel: "Khan Academy",
        durationLabel: "6 min",
      },
    ],
    practice: [
      {
        id: "fg-1",
        prompt: "If f(x) = 2x + 1, f(3) =",
        choices: ["5", "6", "7", "8"],
        correctIndex: 2,
        explanation: "2·3 + 1 = 7.",
      },
      {
        id: "fg-2",
        prompt: "Graph of y = x² is a:",
        choices: ["Straight line", "Circle", "Parabola", "Hyperbola"],
        correctIndex: 2,
        explanation: "Quadratic graphs are parabolic.",
      },
      {
        id: "fg-3",
        prompt: "Vertical line test checks if a graph is a:",
        choices: ["Circle", "Function", "Triangle", "Matrix"],
        correctIndex: 1,
        explanation: "If a vertical line hits more than once, it is not a function.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Quadratic equations",
    summary:
      "Solve ax² + bx + c = 0 by factoring, completing the square, or the quadratic formula.",
    objectives: [
      "Solve by factoring",
      "Use the quadratic formula",
      "Interpret roots from a graph",
    ],
    keyPoints: [
      "x = [−b ± √(b² − 4ac)] / (2a)",
      "Discriminant D = b² − 4ac tells number of real roots.",
      "Roots are x-intercepts of y = ax² + bx + c.",
    ],
    videos: [
      {
        youtubeId: "i7idZfS8t8w",
        title: "Quadratic formula",
        channel: "Khan Academy",
        durationLabel: "12 min",
      },
      {
        youtubeId: "u1SAo2GiX8A",
        title: "Solving by factoring",
        channel: "Khan Academy",
        durationLabel: "9 min",
      },
    ],
    practice: [
      {
        id: "qeq-1",
        prompt: "Solutions of x² − 5x + 6 = 0:",
        choices: ["1 and 6", "2 and 3", "−2 and −3", "5 and 6"],
        correctIndex: 1,
        explanation: "(x−2)(x−3) = 0 → x = 2 or 3.",
      },
      {
        id: "qeq-2",
        prompt: "If D = b² − 4ac < 0, number of real roots:",
        choices: ["0", "1", "2", "3"],
        correctIndex: 0,
        explanation: "Negative discriminant → no real roots.",
      },
      {
        id: "qeq-3",
        prompt: "For x² = 9, solutions are:",
        choices: ["x = 9", "x = 3 only", "x = ±3", "x = 0"],
        correctIndex: 2,
        explanation: "x = 3 or x = −3.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Geometry & mensuration",
    summary:
      "Apply area, surface area, and volume formulas to composite shapes for GED-style problems.",
    objectives: [
      "Compute surface area of prisms",
      "Find volume of cylinders and cones",
      "Break composite shapes into simpler parts",
    ],
    keyPoints: [
      "Surface area = sum of all face areas.",
      "Volume of cylinder = πr²h.",
      "Always use consistent units.",
    ],
    videos: [
      {
        youtubeId: "I9efKVtLCf4",
        title: "Volume of rectangular prism",
        channel: "Khan Academy",
        durationLabel: "5 min",
      },
      {
        youtubeId: "gL3HxBQyeg0",
        title: "Volume of a cylinder",
        channel: "Khan Academy",
        durationLabel: "6 min",
      },
    ],
    practice: [
      {
        id: "gm-1",
        prompt: "Volume of cylinder r=3, h=5 (in terms of π):",
        choices: ["15π", "30π", "45π", "9π"],
        correctIndex: 2,
        explanation: "πr²h = π·9·5 = 45π.",
      },
      {
        id: "gm-2",
        prompt: "A cube of side 4 has volume:",
        choices: ["16", "48", "64", "12"],
        correctIndex: 2,
        explanation: "4³ = 64.",
      },
      {
        id: "gm-3",
        prompt: "Surface area of cube side 3:",
        choices: ["9", "27", "54", "36"],
        correctIndex: 2,
        explanation: "6 × 3² = 54.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Trigonometry",
    summary:
      "Extend SOH-CAH-TOA to non-right cases with sine/cosine rules awareness and angle of elevation problems.",
    objectives: [
      "Solve right-triangle trig problems",
      "Use angles of elevation/depression",
      "Apply exact values for 30°, 45°, 60°",
    ],
    keyPoints: [
      "sin 30° = 1/2, cos 60° = 1/2, tan 45° = 1",
      "Angle of elevation: looking up from horizontal.",
      "Always sketch before calculating.",
    ],
    videos: [
      {
        youtubeId: "Jsiy4TxgIME",
        title: "Trigonometric ratios",
        channel: "Khan Academy",
        durationLabel: "9 min",
      },
      {
        youtubeId: "Jsiy4TxgIME",
        title: "Exact trig values",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
    ],
    practice: [
      {
        id: "tr-1",
        prompt: "sin 30° =",
        choices: ["0", "1/2", "√3/2", "1"],
        correctIndex: 1,
        explanation: "Standard exact value: sin 30° = 1/2.",
      },
      {
        id: "tr-2",
        prompt: "tan 45° =",
        choices: ["0", "1/2", "1", "√3"],
        correctIndex: 2,
        explanation: "tan 45° = 1.",
      },
      {
        id: "tr-3",
        prompt: "In a right triangle, opposite=5, hypotenuse=13. sin θ =",
        choices: ["5/12", "12/13", "5/13", "13/5"],
        correctIndex: 2,
        explanation: "sin = opp/hyp = 5/13.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Statistics & probability",
    summary:
      "Combine averages, charts, and probability for Grade 11 exam-style data questions.",
    objectives: [
      "Interpret statistical charts",
      "Compute combined mean ideas",
      "Solve multi-step probability",
    ],
    keyPoints: [
      "Read scales carefully on graphs.",
      "Independent events: P(A and B) = P(A)·P(B)",
      "Mutually exclusive: P(A or B) = P(A)+P(B)",
    ],
    videos: [
      {
        youtubeId: "h8EYEJ32oQ8",
        title: "Mean, median, mode",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
      {
        youtubeId: "uzkc-qNVoOk",
        title: "Probability basics",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
    ],
    practice: [
      {
        id: "stp-1",
        prompt: "Two fair coins. P(two heads) =",
        choices: ["1/2", "1/3", "1/4", "1"],
        correctIndex: 2,
        explanation: "(1/2)×(1/2) = 1/4.",
      },
      {
        id: "stp-2",
        prompt: "Which average is most affected by outliers?",
        choices: ["Mode", "Median", "Mean", "Range is not an average — but mean"],
        correctIndex: 2,
        explanation: "The mean is pulled by extreme values.",
      },
      {
        id: "stp-3",
        prompt: "P(A)=0.3, P(not A) =",
        choices: ["0.3", "0.7", "1.3", "0"],
        correctIndex: 1,
        explanation: "1 − 0.3 = 0.7.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Linear equations (review)",
    summary:
      "Quick Grade 11 refresh of linear equations before tackling harder algebra and functions.",
    objectives: [
      "Solve multi-step linear equations",
      "Clear fractions in equations",
      "Check solutions by substitution",
    ],
    keyPoints: [
      "Isolate the variable systematically.",
      "Multiply through by the LCD to clear fractions.",
      "Always substitute back to verify.",
    ],
    videos: [
      {
        youtubeId: "1c5HY3z4k8M",
        title: "Variables on both sides",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
      {
        youtubeId: "Z7C69xP08d8",
        title: "Multi-step equations",
        channel: "Khan Academy",
        durationLabel: "9 min",
      },
    ],
    practice: [
      {
        id: "ler-1",
        prompt: "Solve: 5x − 7 = 3x + 5",
        choices: ["x = 6", "x = 1", "x = −6", "x = 2"],
        correctIndex: 0,
        explanation: "2x = 12 → x = 6.",
      },
      {
        id: "ler-2",
        prompt: "Solve: x/2 + 3 = 7",
        choices: ["x = 2", "x = 4", "x = 8", "x = 10"],
        correctIndex: 2,
        explanation: "x/2 = 4 → x = 8.",
      },
      {
        id: "ler-3",
        prompt: "Solve: 2(x + 4) = 18",
        choices: ["x = 5", "x = 7", "x = 11", "x = 9"],
        correctIndex: 0,
        explanation: "x + 4 = 9 → x = 5.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Advanced algebra",
    summary:
      "Manipulate polynomials, rational expressions, and absolute-value equations for Grade 12.",
    objectives: [
      "Simplify rational expressions",
      "Solve absolute value equations",
      "Work with polynomial operations",
    ],
    keyPoints: [
      "|x| = a (a>0) → x = a or x = −a",
      "Cancel only common factors, not terms.",
      "State excluded values where denominator = 0.",
    ],
    videos: [
      {
        youtubeId: "u1SAo2GiX8A",
        title: "Factoring review",
        channel: "Khan Academy",
        durationLabel: "10 min",
      },
      {
        youtubeId: "u6zDpUL5RkU",
        title: "Absolute value equations",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
    ],
    practice: [
      {
        id: "aa-1",
        prompt: "Solve |x| = 5",
        choices: ["x = 5", "x = −5", "x = ±5", "No solution"],
        correctIndex: 2,
        explanation: "Distance from 0 is 5 → x = 5 or −5.",
      },
      {
        id: "aa-2",
        prompt: "(x² − 9)/(x − 3) simplifies to (x≠3):",
        choices: ["x − 3", "x + 3", "x² − 3", "9"],
        correctIndex: 1,
        explanation: "Difference of squares: (x−3)(x+3)/(x−3) = x+3.",
      },
      {
        id: "aa-3",
        prompt: "Degree of 4x³ − x + 7 is:",
        choices: ["1", "2", "3", "4"],
        correctIndex: 2,
        explanation: "Highest power of x is 3.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Rates of change & calculus intro",
    summary:
      "Connect average rate of change to the idea of a derivative as an instantaneous rate.",
    objectives: [
      "Compute average rate of change",
      "Interpret slope as rate",
      "Meet the derivative concept intuitively",
    ],
    keyPoints: [
      "Average rate = Δy / Δx over an interval.",
      "Derivative ≈ slope of the tangent.",
      "d/dx (xⁿ) = n xⁿ⁻¹ for power functions.",
    ],
    videos: [
      {
        youtubeId: "WUvTyaaNkzM",
        title: "Introduction to derivatives",
        channel: "3Blue1Brown",
        durationLabel: "22 min",
      },
      {
        youtubeId: "ANyVpMS3HL4",
        title: "Derivative as slope of tangent",
        channel: "Khan Academy",
        durationLabel: "9 min",
      },
    ],
    practice: [
      {
        id: "rc-1",
        prompt: "Average rate of y from x=1 to x=3 if y(1)=2, y(3)=10:",
        choices: ["4", "8", "2", "12"],
        correctIndex: 0,
        explanation: "(10−2)/(3−1) = 8/2 = 4.",
      },
      {
        id: "rc-2",
        prompt: "Derivative of x³ is:",
        choices: ["3x", "3x²", "x²", "3"],
        correctIndex: 1,
        explanation: "Power rule: 3x².",
      },
      {
        id: "rc-3",
        prompt: "A tangent slope of 0 means the function is locally:",
        choices: ["Increasing fast", "Flat / stationary", "Undefined", "Negative"],
        correctIndex: 1,
        explanation: "Zero derivative → horizontal tangent.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Advanced trigonometry",
    summary:
      "Use identities, radians awareness, and graphs of sin/cos for Grade 12 problems.",
    objectives: [
      "Apply sin²θ + cos²θ = 1",
      "Solve simple trig equations",
      "Read amplitude and period from graphs",
    ],
    keyPoints: [
      "sin²θ + cos²θ = 1",
      "Period of sin/cos is 360° (or 2π radians).",
      "Amplitude is the height from midline to peak.",
    ],
    videos: [
      {
        youtubeId: "Jsiy4TxgIME",
        title: "Exact trig values",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
      {
        youtubeId: "Jsiy4TxgIME",
        title: "Graph of y = sin(x)",
        channel: "Khan Academy",
        durationLabel: "7 min",
      },
    ],
    practice: [
      {
        id: "atr-1",
        prompt: "If cos θ = 3/5, sin²θ =",
        choices: ["9/25", "16/25", "3/5", "4/5"],
        correctIndex: 1,
        explanation: "sin² = 1 − cos² = 1 − 9/25 = 16/25.",
      },
      {
        id: "atr-2",
        prompt: "Period of y = sin x (in degrees):",
        choices: ["90", "180", "360", "720"],
        correctIndex: 2,
        explanation: "Sine repeats every 360°.",
      },
      {
        id: "atr-3",
        prompt: "Amplitude of y = 3 sin x is:",
        choices: ["1", "2", "3", "π"],
        correctIndex: 2,
        explanation: "Coefficient 3 is the amplitude.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Vectors & geometry",
    summary:
      "Add vectors, find magnitude, and use vector geometry language for Grade 12.",
    objectives: [
      "Add vectors component-wise",
      "Find magnitude |v|",
      "Interpret displacement vectors",
    ],
    keyPoints: [
      "Vector ⟨a, b⟩ has magnitude √(a² + b²).",
      "Add vectors by adding components.",
      "Scalar multiplication stretches or shrinks a vector.",
    ],
    videos: [
      {
        youtubeId: "ihNZlp7iUHE",
        title: "Introduction to vectors",
        channel: "Khan Academy",
        durationLabel: "10 min",
      },
    ],
    practice: [
      {
        id: "vg-1",
        prompt: "Magnitude of ⟨3, 4⟩:",
        choices: ["5", "7", "12", "25"],
        correctIndex: 0,
        explanation: "√(9+16) = 5.",
      },
      {
        id: "vg-2",
        prompt: "⟨1, 2⟩ + ⟨3, −1⟩ =",
        choices: ["⟨4, 1⟩", "⟨2, 1⟩", "⟨3, 2⟩", "⟨4, 3⟩"],
        correctIndex: 0,
        explanation: "⟨1+3, 2+(−1)⟩ = ⟨4, 1⟩.",
      },
      {
        id: "vg-3",
        prompt: "2⟨−1, 3⟩ =",
        choices: ["⟨−2, 6⟩", "⟨−1, 6⟩", "⟨2, 3⟩", "⟨−2, 3⟩"],
        correctIndex: 0,
        explanation: "Multiply each component by 2.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Statistical reasoning",
    summary:
      "Interpret distributions, compare data sets, and reason about sampling for exam questions.",
    objectives: [
      "Compare means and spreads",
      "Spot misleading graphs",
      "Understand basic sampling bias",
    ],
    keyPoints: [
      "Larger sample → more reliable estimates (usually).",
      "Correlation is not causation.",
      "Check axes and scales before drawing conclusions.",
    ],
    videos: [
      {
        youtubeId: "h8EYEJ32oQ8",
        title: "Statistics: The average",
        channel: "Khan Academy",
        durationLabel: "7 min",
      },
      {
        youtubeId: "h8EYEJ32oQ8",
        title: "Sampling and bias intro",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
    ],
    practice: [
      {
        id: "sr-1",
        prompt: "A graph with a truncated y-axis can:",
        choices: ["Never mislead", "Exaggerate differences", "Fix bias", "Change the mean"],
        correctIndex: 1,
        explanation: "Cutting the axis makes small differences look huge.",
      },
      {
        id: "sr-2",
        prompt: "Surveying only your friends about a national issue is mainly:",
        choices: ["Random sampling", "Biased sampling", "A census", "Double-blind"],
        correctIndex: 1,
        explanation: "Friends are not a representative sample.",
      },
      {
        id: "sr-3",
        prompt: "Two variables rising together means:",
        choices: ["One causes the other always", "They are associated (correlation)", "They are equal", "No relationship"],
        correctIndex: 1,
        explanation: "Association ≠ proof of causation.",
      },
    ],
  },
  {
    subjectId: "math",
    topic: "Exam-style problem solving",
    summary:
      "Practice multi-step exam questions: read carefully, plan, calculate, and check — the Grade 12 finishing skill.",
    objectives: [
      "Break word problems into steps",
      "Choose the right formula",
      "Estimate to catch errors",
    ],
    keyPoints: [
      "Underline what is asked and what is given.",
      "Draw a sketch for geometry/trig.",
      "Check units and reasonableness of the answer.",
    ],
    videos: [
      {
        youtubeId: "Z7C69xP08d8",
        title: "Multi-step equation strategy",
        channel: "Khan Academy",
        durationLabel: "9 min",
      },
      {
        youtubeId: "9IUEk9fn2Vs",
        title: "Harder linear equation example",
        channel: "Khan Academy",
        durationLabel: "8 min",
      },
    ],
    practice: [
      {
        id: "esp-1",
        prompt: "A shirt costs 20 OMR after 20% off. Original price was:",
        choices: ["24 OMR", "25 OMR", "16 OMR", "22 OMR"],
        correctIndex: 1,
        explanation: "80% of original = 20 → original = 20/0.8 = 25.",
      },
      {
        id: "esp-2",
        prompt: "First step for a long word problem should be:",
        choices: ["Guess randomly", "Identify knowns and unknowns", "Skip reading", "Only use calculator"],
        correctIndex: 1,
        explanation: "Clarify data and goal before calculating.",
      },
      {
        id: "esp-3",
        prompt: "If your area answer is negative, you should:",
        choices: ["Accept it", "Recheck signs/setup", "Multiply by −1 always", "Ignore units"],
        correctIndex: 1,
        explanation: "Area cannot be negative — fix the method.",
      },
    ],
  },
];
