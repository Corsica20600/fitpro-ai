const FALLBACK_FRENCH_COPY = "Instructions françaises en cours de préparation";

const DEFAULT_STEP_TITLES = [
  "Position de départ",
  "Mise en tension",
  "Phase principale",
  "Retour contrôlé",
  "Rythme",
];

const DIPS_GUIDE_SLUGS = new Set([
  "dips-assistes",
  "dips-chest-version",
  "dip-machine",
  "parallel-bar-dip",
]);

const DIPS_STEPS = [
  "Buste penché vers l'avant, poignées saisies, épaules basses et stables.",
  "Descendez lentement en ouvrant légèrement les coudes.",
  "Atteignez le point bas avec un étirement net des pectoraux.",
  "Remontez en poussant fort, sans verrouiller brutalement les bras.",
  "Gardez la tension sur les pectoraux avant de relancer la répétition.",
];

const DIPS_KEY_POINTS = [
  "Buste penché vers l'avant pour cibler les pectoraux.",
  "Coudes légèrement ouverts.",
  "Descente profonde et contrôlée.",
  "Épaules basses et stables.",
  "Mouvement maîtrisé du début à la fin.",
];

const DIPS_MISTAKES = [
  "Rester trop droit et transformer le mouvement en exercice triceps.",
  "Descendre à moitié.",
  "Laisser les épaules monter.",
  "Utiliser trop d'assistance.",
  "Coller les coudes au corps.",
];

type ExerciseTechniqueSource = {
  slug: string;
  instructionsFr: string | null;
  detailedInstructions: string;
  shortTechnicalCues: string[];
  commonMistakesFr: string[];
  commonMistakes: string[];
};

function uniqueText(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of items) {
    const value = raw.replace(/\s+/g, " ").trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase("fr");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }

  return out;
}

function isFrenchReady(value: string | null | undefined) {
  if (!value?.trim()) return false;

  const lower = value.toLocaleLowerCase("fr");
  const englishMarkers = [
    /\bthis will be your starting position\b/,
    /\brepeat for the recommended\b/,
    /\blie down on\b/,
    /\blie on your\b/,
    /\bstand up with\b/,
    /\byour torso\b/,
    /\byour knees\b/,
    /\bkeep the\b/,
    /\bbreathe out\b/,
  ];

  return !englishMarkers.some((marker) => marker.test(lower));
}

function safeFrenchList(items: string[]) {
  return uniqueText(items.filter((item) => isFrenchReady(item)));
}

function splitFrenchInstructions(value: string | null) {
  if (!isFrenchReady(value)) return [];

  const normalized = (value ?? "")
    .replace(/\((?:Remarque|Note)\s*:\s*/gi, "(")
    .replace(/\bConseil\s*:\s*/gi, "")
    .replace(/\bAstuce\s*:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return uniqueText(
    normalized
      .split(/(?<=[.!?])\s+/)
      .map((item) => item.replace(/[.!?]+$/, "").trim())
      .filter((item) => item.length > 12),
  );
}

function pickStepSentences(sentences: string[]) {
  if (sentences.length <= 5) return sentences;

  return uniqueText([
    sentences[0] ?? "",
    sentences[1] ?? "",
    sentences[Math.floor(sentences.length / 2)] ?? "",
    sentences[sentences.length - 2] ?? "",
    sentences[sentences.length - 1] ?? "",
  ]).slice(0, 5);
}

function getKeyPoints(sentences: string[]) {
  const cueMarkers = [
    "gard",
    "assurez",
    "concentr",
    "contrô",
    "controle",
    "inspirez",
    "expirez",
    "sans",
    "lentement",
    "position",
  ];

  const cueSentences = sentences.filter((sentence) => {
    const lower = sentence.toLocaleLowerCase("fr");
    return cueMarkers.some((marker) => lower.includes(marker));
  });

  return uniqueText([...cueSentences, ...sentences])
    .map((item) => item.length > 118 ? `${item.slice(0, 115).trim()}...` : item)
    .slice(0, 5);
}

export function buildExerciseDetailContent(exercise: ExerciseTechniqueSource) {
  if (DIPS_GUIDE_SLUGS.has(exercise.slug)) {
    return {
      hasFrenchInstructions: true,
      stepTitles: DEFAULT_STEP_TITLES,
      steps: DIPS_STEPS,
      keyPoints: DIPS_KEY_POINTS,
      mistakes: DIPS_MISTAKES,
      sourceNote: "Guide technique optimisé",
    };
  }

  const sentences = splitFrenchInstructions(exercise.instructionsFr);
  const hasFrenchInstructions = sentences.length > 0;
  const steps = hasFrenchInstructions
    ? pickStepSentences(sentences)
    : [FALLBACK_FRENCH_COPY];
  const keyPoints = hasFrenchInstructions
    ? getKeyPoints(sentences)
    : [FALLBACK_FRENCH_COPY];
  const mistakes = safeFrenchList(exercise.commonMistakesFr);

  return {
    hasFrenchInstructions,
    stepTitles: DEFAULT_STEP_TITLES,
    steps,
    keyPoints,
    mistakes: mistakes.length ? mistakes : ["Erreurs spécifiques en cours de préparation"],
    sourceNote: hasFrenchInstructions ? "Instructions françaises validées" : FALLBACK_FRENCH_COPY,
  };
}
