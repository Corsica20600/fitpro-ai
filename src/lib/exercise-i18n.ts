const directMap: Record<string, string> = {
  abdominals: "abdominaux",
  hamstrings: "ischio-jambiers",
  quadriceps: "quadriceps",
  glutes: "fessiers",
  calves: "mollets",
  chest: "pectoraux",
  lats: "grand dorsal",
  "middle back": "dos moyen",
  "lower back": "bas du dos",
  shoulders: "epaules",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "avant-bras",
  traps: "trapezes",
  adductors: "adducteurs",
  abductors: "abducteurs",
  obliques: "obliques",
  "body only": "poids du corps",
  dumbbell: "halteres",
  barbell: "barre",
  cable: "poulie",
  machine: "machine",
  kettlebells: "kettlebells",
  beginner: "debutant",
  intermediate: "intermediaire",
  expert: "avance",
  advanced: "avance",
  strength: "force",
  stretching: "mobilite",
  cardio: "cardio",
  plyometrics: "pliometrie",
  powerlifting: "force athletique",
  strongman: "strongman",
};

const tokenMap: Record<string, string> = {
  press: "developpe",
  curl: "curl",
  squat: "squat",
  raise: "elevation",
  row: "tirage",
  pull: "traction",
  push: "poussee",
  machine: "machine",
  dumbbell: "halteres",
  barbell: "barre",
  cable: "poulie",
  bodyweight: "poids du corps",
  body: "corps",
  only: "seulement",
};

const phraseMap: Array<[RegExp, string]> = [
  [/\blie down on the floor\b/gi, "allongez-vous au sol"],
  [/\bsecure your feet\b/gi, "stabilisez vos pieds"],
  [/\byour legs should be bent at the knees\b/gi, "gardez les jambes fléchies aux genoux"],
  [/\bplace your hands behind or to the side of your head\b/gi, "placez les mains derrière ou sur le côté de la tête"],
  [/\byou will begin with your back on the ground\b/gi, "démarrez avec le dos au sol"],
  [/\bthis will be your starting position\b/gi, "c'est votre position de départ"],
  [/\bflex your hips and spine\b/gi, "fléchissez les hanches et la colonne"],
  [/\braise your torso toward your knees\b/gi, "remontez le buste vers les genoux"],
  [/\bat the top of the contraction\b/gi, "en fin de contraction"],
  [/\breverse the motion\b/gi, "inversez le mouvement"],
  [/\brepeat for the recommended amount of repetitions\b/gi, "répétez selon le nombre de répétitions prévu"],
  [/\bstarting position\b/gi, "position de départ"],
  [/\brepetitions\b/gi, "répétitions"],
  [/\brepetition\b/gi, "répétition"],
  [/\bslowly\b/gi, "lentement"],
  [/\bcontrol(?:led)?\b/gi, "contrôlé"],
  [/\bwithout\b/gi, "sans"],
  [/\bwith\b/gi, "avec"],
  [/\bfeet\b/gi, "pieds"],
  [/\bback\b/gi, "dos"],
  [/\bknees\b/gi, "genoux"],
  [/\bhips\b/gi, "hanches"],
  [/\btorso\b/gi, "buste"],
  [/\bground\b/gi, "sol"],
];

function norm(value: string) {
  return value.trim().toLowerCase();
}

function title(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function translateSimple(value: string): { text: string; translated: boolean } {
  const key = norm(value);
  if (!key) return { text: value, translated: false };
  if (directMap[key]) return { text: title(directMap[key]), translated: true };

  const tokens = key.split(/[\s/_-]+/).filter(Boolean);
  let changed = false;
  const out = tokens.map((token) => {
    const mapped = tokenMap[token];
    if (mapped) {
      changed = true;
      return mapped;
    }
    return token;
  });

  return { text: title(out.join(" ")), translated: changed };
}

export function looksEnglish(value: string): boolean {
  const lower = norm(value);
  if (!lower) return false;
  const markers = [
    " the ",
    " and ",
    " with ",
    " without ",
    " your ",
    " should ",
    " begin ",
    " starting position",
    " repeat ",
    " knees",
    " torso",
    " floor",
  ];
  return markers.some((m) => lower.includes(m.trim()));
}

export function translateSentence(value: string): { text: string; translated: boolean } {
  if (!value.trim()) return { text: value, translated: false };
  let output = value;
  let changed = false;

  for (const [pattern, replacement] of phraseMap) {
    const next = output.replace(pattern, replacement);
    if (next !== output) changed = true;
    output = next;
  }

  // Fallback token-level replacement when phrase map didn't catch everything.
  if (!changed) {
    const simple = translateSimple(value);
    return simple;
  }

  return { text: output, translated: true };
}

export function translateList(values: string[]): { items: string[]; translatedCount: number } {
  let translatedCount = 0;
  const items = values.map((value) => {
    const result = translateSimple(value);
    if (result.translated) translatedCount += 1;
    return result.text;
  });
  return { items, translatedCount };
}

export function levelToFr(level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"): string {
  if (level === "BEGINNER") return "Debutant";
  if (level === "INTERMEDIATE") return "Intermediaire";
  return "Avance";
}

export function categoryToFr(category: string): string {
  const map: Record<string, string> = {
    CHEST: "Pectoraux",
    BACK: "Dos",
    SHOULDERS: "Epaules",
    BICEPS: "Bras",
    TRICEPS: "Bras",
    LEGS: "Jambes",
    ABS: "Abdos",
    CARDIO_MOBILITY: "Cardio",
  };
  return map[category] ?? category;
}
