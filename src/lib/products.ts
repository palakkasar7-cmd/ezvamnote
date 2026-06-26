export type Subject = "Physics" | "Chemistry" | "Mathematics" | "Biology";
export type NoteType = "Chapter-wise" | "Full Subject" | "PYQ Solved" | "Formula Booklet";

export interface Product {
  slug: string;
  title: string;
  subject: Subject;
  type: NoteType;
  author: string;
  pages: number;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  cover: string;
  tagline: string;
  chapters: string[];
  highlights: string[];
}

export const PRODUCTS: Product[] = [
  {
    slug: "physics-complete-std12",
    title: "Physics — Complete Std 12",
    subject: "Physics",
    type: "Full Subject",
    author: "Aarav R., AIR 312",
    pages: 412,
    price: 499,
    originalPrice: 799,
    rating: 4.9,
    reviews: 1284,
    cover: "physics",
    tagline: "Every chapter. Every derivation. One notebook.",
    chapters: [
      "Rotational Dynamics", "Mechanical Properties of Fluids", "Kinetic Theory of Gases",
      "Thermodynamics", "Oscillations", "Superposition of Waves", "Wave Optics",
      "Electrostatics", "Current Electricity", "Magnetic Fields", "Electromagnetic Induction",
      "AC Circuits", "Dual Nature of Radiation", "Atoms, Molecules & Nuclei", "Semiconductors",
    ],
    highlights: [
      "Hand-drawn ray & circuit diagrams",
      "Mht-CET pattern margin notes",
      "Step-by-step derivations, no skips",
      "Last-7-day revision shortlist",
    ],
  },
  {
    slug: "chemistry-complete-std12",
    title: "Chemistry — Complete Std 12",
    subject: "Chemistry",
    type: "Full Subject",
    author: "Sara M., Topper 99.7%ile",
    pages: 388,
    price: 499,
    originalPrice: 799,
    rating: 4.9,
    reviews: 1102,
    cover: "chemistry",
    tagline: "Organic mechanisms drawn by hand, atom by atom.",
    chapters: [
      "Solid State", "Solutions", "Ionic Equilibria", "Chemical Thermodynamics",
      "Electrochemistry", "Chemical Kinetics", "Elements of Groups 16, 17, 18",
      "Transition & Inner-transition Elements", "Coordination Compounds",
      "Halogen Derivatives", "Alcohols, Phenols, Ethers", "Aldehydes, Ketones & Acids",
      "Amines", "Biomolecules", "Green Chemistry",
    ],
    highlights: [
      "All NCERT-named reactions",
      "Color-free, exam-paper friendly",
      "Memory hooks for every group",
      "Common errors flagged in margins",
    ],
  },
  {
    slug: "maths-complete-std12",
    title: "Mathematics — Complete Std 12",
    subject: "Mathematics",
    type: "Full Subject",
    author: "Kabir T., IIT-B",
    pages: 446,
    price: 549,
    originalPrice: 849,
    rating: 4.95,
    reviews: 1597,
    cover: "maths",
    tagline: "Every shortcut a topper actually uses.",
    chapters: [
      "Mathematical Logic", "Matrices", "Trigonometric Functions", "Pair of Lines",
      "Vectors", "Line & Plane", "Linear Programming", "Differentiation",
      "Applications of Derivatives", "Indefinite Integration", "Definite Integration",
      "Applications of Definite Integral", "Differential Equations", "Probability Distribution",
      "Binomial Distribution",
    ],
    highlights: [
      "1000+ worked examples",
      "Speed-tricks for MCQ",
      "Common JEE-style traps marked",
      "Formula sheet at end of every chapter",
    ],
  },
  {
    slug: "biology-complete-std12",
    title: "Biology — Complete Std 12",
    subject: "Biology",
    type: "Full Subject",
    author: "Ira P., NEET 99.2%ile",
    pages: 360,
    price: 499,
    originalPrice: 799,
    rating: 4.85,
    reviews: 864,
    cover: "biology",
    tagline: "Hand-drawn diagrams that actually look like the textbook.",
    chapters: [
      "Reproduction in Lower & Higher Plants", "Human Reproduction", "Inheritance & Variation",
      "Molecular Basis of Inheritance", "Origin & Evolution", "Plant Water Relations",
      "Plant Growth & Mineral Nutrition", "Respiration & Circulation", "Excretion & Osmoregulation",
      "Control & Coordination", "Human Health & Diseases", "Enhancement of Food Production",
      "Biotechnology", "Organisms & Populations", "Ecosystems & Energy Flow",
    ],
    highlights: [
      "Every diagram redrawn cleanly",
      "Latin names with mnemonics",
      "Diff. tables for fast recall",
      "MHT-CET + NEET cross-tagged",
    ],
  },
  {
    slug: "physics-pyq",
    title: "Physics — 10 Year PYQ Solved",
    subject: "Physics",
    type: "PYQ Solved",
    author: "Aarav R., AIR 312",
    pages: 188,
    price: 249,
    originalPrice: 399,
    rating: 4.8,
    reviews: 612,
    cover: "physics-pyq",
    tagline: "Last 10 years of MHT-CET, fully solved by hand.",
    chapters: ["2015–2024 paper-wise solutions", "Topic-wise reorder", "Difficulty tags"],
    highlights: ["Every option explained", "Trick vs. trap analysis", "Most-repeated concepts circled"],
  },
  {
    slug: "chemistry-pyq",
    title: "Chemistry — 10 Year PYQ Solved",
    subject: "Chemistry",
    type: "PYQ Solved",
    author: "Sara M., Topper 99.7%ile",
    pages: 176,
    price: 249,
    originalPrice: 399,
    rating: 4.82,
    reviews: 540,
    cover: "chemistry-pyq",
    tagline: "Mechanism-first solutions, not just answers.",
    chapters: ["2015–2024 paper-wise solutions", "Topic-wise reorder", "Concept tags"],
    highlights: ["Full mechanism arrows", "Cross-references to chapter notes", "Memory hooks"],
  },
  {
    slug: "maths-pyq",
    title: "Mathematics — 10 Year PYQ Solved",
    subject: "Mathematics",
    type: "PYQ Solved",
    author: "Kabir T., IIT-B",
    pages: 224,
    price: 299,
    originalPrice: 449,
    rating: 4.92,
    reviews: 781,
    cover: "maths-pyq",
    tagline: "Solved two ways — long method and shortcut.",
    chapters: ["2015–2024 paper-wise", "Topic-wise reorder", "Time-target per question"],
    highlights: ["Speed tricks per Q", "Trap-option breakdown", "Predicted pattern notes"],
  },
  {
    slug: "physics-formula",
    title: "Physics — Formula Booklet",
    subject: "Physics",
    type: "Formula Booklet",
    author: "Aarav R., AIR 312",
    pages: 64,
    price: 149,
    originalPrice: 249,
    rating: 4.88,
    reviews: 933,
    cover: "physics-formula",
    tagline: "Pocket booklet. Every formula. Hand-written.",
    chapters: ["All 15 chapters", "Units & dimensions", "Constants"],
    highlights: ["Fits in your bag", "Margin diagrams", "Color-free print friendly"],
  },
  {
    slug: "maths-formula",
    title: "Mathematics — Formula Booklet",
    subject: "Mathematics",
    type: "Formula Booklet",
    author: "Kabir T., IIT-B",
    pages: 72,
    price: 149,
    originalPrice: 249,
    rating: 4.9,
    reviews: 1021,
    cover: "maths-formula",
    tagline: "Every identity. Every trick. One pocket book.",
    chapters: ["All chapters", "Trig identities", "Integrals quick-table"],
    highlights: ["Speed shortcuts", "Common-error flags", "Print-ready"],
  },
  {
    slug: "chemistry-named-reactions",
    title: "Organic — Named Reactions",
    subject: "Chemistry",
    type: "Chapter-wise",
    author: "Sara M., Topper 99.7%ile",
    pages: 96,
    price: 199,
    originalPrice: 299,
    rating: 4.87,
    reviews: 488,
    cover: "chemistry-named",
    tagline: "Every named reaction with full mechanism.",
    chapters: ["Aldol", "Cannizzaro", "Hofmann", "Wurtz", "Reimer-Tiemann", "+ 40 more"],
    highlights: ["Arrow-pushing", "Why each reagent", "When-asked patterns"],
  },
];

export function findProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export const SUBJECTS: Subject[] = ["Physics", "Chemistry", "Mathematics", "Biology"];
export const NOTE_TYPES: NoteType[] = ["Full Subject", "Chapter-wise", "PYQ Solved", "Formula Booklet"];
