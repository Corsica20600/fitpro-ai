import {
  ExerciseCategory,
  ExerciseMovementType,
  ExerciseObjective,
  MediaFormat,
  MediaType,
  ProgramLevel,
} from "@prisma/client";

export type ExerciseCatalogItem = {
  slug: string;
  name: string;
  category: ExerciseCategory;
  movementType: ExerciseMovementType;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: ProgramLevel;
  objectives: ExerciseObjective[];
  shortTechnicalCues: string[];
  detailedInstructions: string;
  commonMistakes: string[];
  variants: string[];
  alternatives: string[];
  tags: string[];
  contraindications: string[];
  isCompound: boolean;
};

export type ExerciseCatalogMedia = {
  type: MediaType;
  format: MediaFormat;
  storagePath: string;
  publicUrl: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  isLoop?: boolean;
  sourceName?: string;
  sourceUrl?: string;
  license?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

type BaseExercise = Omit<
  ExerciseCatalogItem,
  "objectives" | "shortTechnicalCues" | "commonMistakes" | "variants" | "alternatives" | "tags" | "contraindications"
>;

const exercisesBase: BaseExercise[] = [
  { slug: "barbell-bench-press", name: "Barbell Bench Press", category: "CHEST", movementType: "COMPOUND", primaryMuscles: ["Pectoraux"], secondaryMuscles: ["Triceps", "Deltoide anterieur"], equipment: ["Barre"], difficulty: "INTERMEDIATE", detailedInstructions: "Pieds ancrés, omoplates serrées, barre vers le bas des pectoraux puis poussée verticale.", isCompound: true },
  { slug: "incline-dumbbell-press", name: "Incline Dumbbell Press", category: "CHEST", movementType: "COMPOUND", primaryMuscles: ["Pectoraux superieurs"], secondaryMuscles: ["Triceps", "Deltoides"], equipment: ["Halteres"], difficulty: "INTERMEDIATE", detailedInstructions: "Banc incliné à 30-45°, descente contrôlée et montée sans collision des haltères.", isCompound: true },
  { slug: "machine-chest-press", name: "Machine Chest Press", category: "CHEST", movementType: "COMPOUND", primaryMuscles: ["Pectoraux"], secondaryMuscles: ["Triceps"], equipment: ["Machine"], difficulty: "BEGINNER", detailedInstructions: "Poignées à hauteur poitrine, trajectoire stable, verrouillage doux en haut.", isCompound: true },
  { slug: "cable-fly", name: "Cable Fly", category: "CHEST", movementType: "ISOLATION", primaryMuscles: ["Pectoraux"], secondaryMuscles: ["Deltoide anterieur"], equipment: ["Poulie"], difficulty: "BEGINNER", detailedInstructions: "Coudes légèrement fléchis, mouvement en arc jusqu’au centre sans rebond.", isCompound: false },
  { slug: "push-up", name: "Push-Up", category: "CHEST", movementType: "COMPOUND", primaryMuscles: ["Pectoraux"], secondaryMuscles: ["Triceps", "Core"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Corps aligné, poitrine proche du sol, poussée complète sans casser les hanches.", isCompound: true },
  { slug: "chest-dips", name: "Chest Dips", category: "CHEST", movementType: "COMPOUND", primaryMuscles: ["Pectoraux inferieurs"], secondaryMuscles: ["Triceps", "Deltoide anterieur"], equipment: ["Poids du corps"], difficulty: "ADVANCED", detailedInstructions: "Buste légèrement penché, descendre contrôlé puis pousser fort sans balancer.", isCompound: true },
  { slug: "pull-up", name: "Pull-Up", category: "BACK", movementType: "COMPOUND", primaryMuscles: ["Grand dorsal"], secondaryMuscles: ["Biceps", "Rhomboides"], equipment: ["Poids du corps"], difficulty: "ADVANCED", detailedInstructions: "Tirer les coudes vers les hanches et garder le tronc gainé pendant la montée.", isCompound: true },
  { slug: "lat-pulldown", name: "Lat Pulldown", category: "BACK", movementType: "COMPOUND", primaryMuscles: ["Grand dorsal"], secondaryMuscles: ["Biceps"], equipment: ["Poulie"], difficulty: "BEGINNER", detailedInstructions: "Poitrine haute, tirer vers le haut du torse, remonter lentement sans lâcher.", isCompound: true },
  { slug: "barbell-row", name: "Barbell Row", category: "BACK", movementType: "COMPOUND", primaryMuscles: ["Dos milieu"], secondaryMuscles: ["Lombaires", "Biceps"], equipment: ["Barre"], difficulty: "INTERMEDIATE", detailedInstructions: "Hinge stable, traction vers le nombril, pause courte en contraction.", isCompound: true },
  { slug: "seated-cable-row", name: "Seated Cable Row", category: "BACK", movementType: "COMPOUND", primaryMuscles: ["Rhomboides"], secondaryMuscles: ["Grand dorsal", "Biceps"], equipment: ["Poulie"], difficulty: "BEGINNER", detailedInstructions: "Traction horizontale, poitrine ouverte, contrôler le retour complet.", isCompound: true },
  { slug: "single-arm-dumbbell-row", name: "Single Arm Dumbbell Row", category: "BACK", movementType: "COMPOUND", primaryMuscles: ["Grand dorsal"], secondaryMuscles: ["Biceps", "Core"], equipment: ["Halteres"], difficulty: "BEGINNER", detailedInstructions: "Dos plat, tirer le coude proche du buste, allonger pleinement en bas.", isCompound: true },
  { slug: "face-pull", name: "Face Pull", category: "BACK", movementType: "ISOLATION", primaryMuscles: ["Arriere d’epaules"], secondaryMuscles: ["Trapèzes", "Rhomboides"], equipment: ["Poulie"], difficulty: "BEGINNER", detailedInstructions: "Corde vers le visage, coudes hauts, finir en rotation externe.", isCompound: false },
  { slug: "barbell-overhead-press", name: "Barbell Overhead Press", category: "SHOULDERS", movementType: "COMPOUND", primaryMuscles: ["Deltoides"], secondaryMuscles: ["Triceps", "Core"], equipment: ["Barre"], difficulty: "INTERMEDIATE", detailedInstructions: "Gainage serré, trajectoire verticale, tête traverse en fin de poussée.", isCompound: true },
  { slug: "seated-dumbbell-press", name: "Seated Dumbbell Press", category: "SHOULDERS", movementType: "COMPOUND", primaryMuscles: ["Deltoides"], secondaryMuscles: ["Triceps"], equipment: ["Halteres"], difficulty: "BEGINNER", detailedInstructions: "Départ oreille, montée simultanée, contrôle constant du buste.", isCompound: true },
  { slug: "lateral-raise", name: "Lateral Raise", category: "SHOULDERS", movementType: "ISOLATION", primaryMuscles: ["Deltoide lateral"], secondaryMuscles: ["Trapèzes"], equipment: ["Halteres"], difficulty: "BEGINNER", detailedInstructions: "Bras légèrement pliés, lever jusqu’à l’horizontale sans lancer.", isCompound: false },
  { slug: "reverse-pec-deck", name: "Reverse Pec Deck", category: "SHOULDERS", movementType: "ISOLATION", primaryMuscles: ["Deltoide posterieur"], secondaryMuscles: ["Rhomboides"], equipment: ["Machine"], difficulty: "BEGINNER", detailedInstructions: "Poitrine collée au dossier, ouverture contrôlée et pause en fin de course.", isCompound: false },
  { slug: "cable-lateral-raise", name: "Cable Lateral Raise", category: "SHOULDERS", movementType: "ISOLATION", primaryMuscles: ["Deltoide lateral"], secondaryMuscles: ["Core"], equipment: ["Poulie"], difficulty: "INTERMEDIATE", detailedInstructions: "Tension continue du bas vers le haut, amplitude propre sans torsion.", isCompound: false },
  { slug: "arnold-press", name: "Arnold Press", category: "SHOULDERS", movementType: "COMPOUND", primaryMuscles: ["Deltoides"], secondaryMuscles: ["Triceps"], equipment: ["Halteres"], difficulty: "INTERMEDIATE", detailedInstructions: "Rotation fluide des poignets pendant la poussée, rythme régulier.", isCompound: true },
  { slug: "barbell-curl", name: "Barbell Curl", category: "BICEPS", movementType: "ISOLATION", primaryMuscles: ["Biceps"], secondaryMuscles: ["Avant-bras"], equipment: ["Barre"], difficulty: "BEGINNER", detailedInstructions: "Coudes fixes, montée contrôlée, descente complète sans élan.", isCompound: false },
  { slug: "incline-dumbbell-curl", name: "Incline Dumbbell Curl", category: "BICEPS", movementType: "ISOLATION", primaryMuscles: ["Biceps long"], secondaryMuscles: ["Avant-bras"], equipment: ["Halteres"], difficulty: "INTERMEDIATE", detailedInstructions: "Bras derrière le buste, supination forte en haut.", isCompound: false },
  { slug: "hammer-curl", name: "Hammer Curl", category: "BICEPS", movementType: "ISOLATION", primaryMuscles: ["Brachial"], secondaryMuscles: ["Biceps"], equipment: ["Halteres"], difficulty: "BEGINNER", detailedInstructions: "Poignets neutres, trajectoire verticale, pas de balancement.", isCompound: false },
  { slug: "cable-curl", name: "Cable Curl", category: "BICEPS", movementType: "ISOLATION", primaryMuscles: ["Biceps"], secondaryMuscles: ["Avant-bras"], equipment: ["Poulie"], difficulty: "BEGINNER", detailedInstructions: "Stabilité du tronc et tension constante sur tout le mouvement.", isCompound: false },
  { slug: "concentration-curl", name: "Concentration Curl", category: "BICEPS", movementType: "ISOLATION", primaryMuscles: ["Biceps"], secondaryMuscles: ["Avant-bras"], equipment: ["Halteres"], difficulty: "BEGINNER", detailedInstructions: "Coude calé sur la cuisse, montée propre puis descente lente.", isCompound: false },
  { slug: "ez-bar-curl", name: "EZ Bar Curl", category: "BICEPS", movementType: "ISOLATION", primaryMuscles: ["Biceps"], secondaryMuscles: ["Avant-bras"], equipment: ["Barre"], difficulty: "BEGINNER", detailedInstructions: "Prise confortable, coudes fixes, amplitude complète.", isCompound: false },
  { slug: "skull-crusher", name: "Skull Crusher", category: "TRICEPS", movementType: "ISOLATION", primaryMuscles: ["Triceps"], secondaryMuscles: ["Avant-bras"], equipment: ["Barre"], difficulty: "INTERMEDIATE", detailedInstructions: "Bras stables, descendre la barre près du front puis étendre fort.", isCompound: false },
  { slug: "rope-pushdown", name: "Rope Pushdown", category: "TRICEPS", movementType: "ISOLATION", primaryMuscles: ["Triceps"], secondaryMuscles: ["Deltoide anterieur"], equipment: ["Poulie"], difficulty: "BEGINNER", detailedInstructions: "Coudes collés, extension complète et séparation des cordes en bas.", isCompound: false },
  { slug: "close-grip-bench-press", name: "Close Grip Bench Press", category: "TRICEPS", movementType: "COMPOUND", primaryMuscles: ["Triceps"], secondaryMuscles: ["Pectoraux", "Deltoides"], equipment: ["Barre"], difficulty: "INTERMEDIATE", detailedInstructions: "Prise serrée, descente contrôlée sur le sternum puis poussée verticale.", isCompound: true },
  { slug: "overhead-triceps-extension", name: "Overhead Triceps Extension", category: "TRICEPS", movementType: "ISOLATION", primaryMuscles: ["Longue portion triceps"], secondaryMuscles: ["Core"], equipment: ["Halteres"], difficulty: "BEGINNER", detailedInstructions: "Coudes proches de la tête, descente arrière puis extension complète.", isCompound: false },
  { slug: "bench-dips", name: "Bench Dips", category: "TRICEPS", movementType: "COMPOUND", primaryMuscles: ["Triceps"], secondaryMuscles: ["Epaules"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Mains stables sur banc, descendre droit puis pousser sans verrou brutal.", isCompound: true },
  { slug: "machine-triceps-extension", name: "Machine Triceps Extension", category: "TRICEPS", movementType: "ISOLATION", primaryMuscles: ["Triceps"], secondaryMuscles: [], equipment: ["Machine"], difficulty: "BEGINNER", detailedInstructions: "Aligner l’articulation du coude et contrôler chaque répétition.", isCompound: false },
  { slug: "back-squat", name: "Back Squat", category: "LEGS", movementType: "COMPOUND", primaryMuscles: ["Quadriceps", "Fessiers"], secondaryMuscles: ["Core", "Ischios"], equipment: ["Barre"], difficulty: "ADVANCED", detailedInstructions: "Hanches sous les genoux, genoux suivis des orteils et remontée puissante.", isCompound: true },
  { slug: "front-squat", name: "Front Squat", category: "LEGS", movementType: "COMPOUND", primaryMuscles: ["Quadriceps"], secondaryMuscles: ["Core", "Fessiers"], equipment: ["Barre"], difficulty: "ADVANCED", detailedInstructions: "Coudes hauts, torse vertical, descente profonde puis extension contrôlée.", isCompound: true },
  { slug: "leg-press", name: "Leg Press", category: "LEGS", movementType: "COMPOUND", primaryMuscles: ["Quadriceps"], secondaryMuscles: ["Fessiers", "Ischios"], equipment: ["Machine"], difficulty: "BEGINNER", detailedInstructions: "Pieds stables, amplitude maîtrisée, ne pas verrouiller brutalement les genoux.", isCompound: true },
  { slug: "romanian-deadlift", name: "Romanian Deadlift", category: "LEGS", movementType: "COMPOUND", primaryMuscles: ["Ischios", "Fessiers"], secondaryMuscles: ["Lombaires"], equipment: ["Barre"], difficulty: "INTERMEDIATE", detailedInstructions: "Charnière de hanches, barre proche des cuisses, dos neutre constant.", isCompound: true },
  { slug: "walking-lunge", name: "Walking Lunge", category: "LEGS", movementType: "COMPOUND", primaryMuscles: ["Quadriceps", "Fessiers"], secondaryMuscles: ["Ischios", "Core"], equipment: ["Halteres"], difficulty: "INTERMEDIATE", detailedInstructions: "Grand pas, buste stable, pousser via le talon avant.", isCompound: true },
  { slug: "leg-curl", name: "Leg Curl", category: "LEGS", movementType: "ISOLATION", primaryMuscles: ["Ischios"], secondaryMuscles: ["Mollets"], equipment: ["Machine"], difficulty: "BEGINNER", detailedInstructions: "Contracter fort en haut, redescendre sans décoller le bassin.", isCompound: false },
  { slug: "leg-extension", name: "Leg Extension", category: "LEGS", movementType: "ISOLATION", primaryMuscles: ["Quadriceps"], secondaryMuscles: [], equipment: ["Machine"], difficulty: "BEGINNER", detailedInstructions: "Extension complète, pause courte en haut, retour contrôlé.", isCompound: false },
  { slug: "hip-thrust", name: "Hip Thrust", category: "LEGS", movementType: "COMPOUND", primaryMuscles: ["Fessiers"], secondaryMuscles: ["Ischios", "Core"], equipment: ["Barre"], difficulty: "INTERMEDIATE", detailedInstructions: "Menton rentré, extension complète des hanches et contrôle sur la descente.", isCompound: true },
  { slug: "standing-calf-raise", name: "Standing Calf Raise", category: "LEGS", movementType: "ISOLATION", primaryMuscles: ["Mollets"], secondaryMuscles: [], equipment: ["Machine"], difficulty: "BEGINNER", detailedInstructions: "Étirement en bas, montée sur la pointe, tempo régulier.", isCompound: false },
  { slug: "goblet-squat", name: "Goblet Squat", category: "LEGS", movementType: "COMPOUND", primaryMuscles: ["Quadriceps", "Fessiers"], secondaryMuscles: ["Core"], equipment: ["Halteres"], difficulty: "BEGINNER", detailedInstructions: "Haltère collé au buste, descendre droit et pousser les genoux vers l’extérieur.", isCompound: true },
  { slug: "crunch", name: "Crunch", category: "ABS", movementType: "ISOLATION", primaryMuscles: ["Grand droit"], secondaryMuscles: ["Obliques"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Enrouler le buste sans tirer la nuque ni décoller les lombaires.", isCompound: false },
  { slug: "hanging-leg-raise", name: "Hanging Leg Raise", category: "ABS", movementType: "ISOLATION", primaryMuscles: ["Abdos inferieurs"], secondaryMuscles: ["Fléchisseurs de hanche"], equipment: ["Poids du corps"], difficulty: "INTERMEDIATE", detailedInstructions: "Monter les jambes sans élan et redescendre lentement.", isCompound: false },
  { slug: "plank", name: "Plank", category: "ABS", movementType: "ISOMETRIC", primaryMuscles: ["Core"], secondaryMuscles: ["Epaules", "Fessiers"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Alignement tête-hanches-talons, respiration calme et gainage actif.", isCompound: false },
  { slug: "ab-wheel-rollout", name: "Ab Wheel Rollout", category: "ABS", movementType: "ISOLATION", primaryMuscles: ["Core"], secondaryMuscles: ["Grand dorsal", "Epaules"], equipment: ["Poids du corps"], difficulty: "ADVANCED", detailedInstructions: "Rouler progressivement et revenir sans cambrer le bas du dos.", isCompound: false },
  { slug: "dead-bug", name: "Dead Bug", category: "ABS", movementType: "ISOMETRIC", primaryMuscles: ["Core profond"], secondaryMuscles: ["Fléchisseurs de hanche"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Bas du dos collé au sol, mouvements alternés lents et propres.", isCompound: false },
  { slug: "cable-wood-chop", name: "Cable Wood Chop", category: "ABS", movementType: "ISOLATION", primaryMuscles: ["Obliques"], secondaryMuscles: ["Core"], equipment: ["Poulie"], difficulty: "INTERMEDIATE", detailedInstructions: "Rotation contrôlée du tronc, hanches stables, retour maîtrisé.", isCompound: false },
  { slug: "rowing-interval", name: "Rowing Interval", category: "CARDIO_MOBILITY", movementType: "CARDIO", primaryMuscles: ["Cardio global"], secondaryMuscles: ["Dos", "Jambes"], equipment: ["Machine"], difficulty: "INTERMEDIATE", detailedInstructions: "Intervalles 30/30, technique propre, cadence élevée sur les phases rapides.", isCompound: true },
  { slug: "air-bike-sprint", name: "Air Bike Sprint", category: "CARDIO_MOBILITY", movementType: "CARDIO", primaryMuscles: ["Cardio global"], secondaryMuscles: ["Jambes", "Epaules"], equipment: ["Machine"], difficulty: "INTERMEDIATE", detailedInstructions: "Sprints courts intenses puis récupération active contrôlée.", isCompound: true },
  { slug: "incline-treadmill-walk", name: "Incline Treadmill Walk", category: "CARDIO_MOBILITY", movementType: "CARDIO", primaryMuscles: ["Cardio"], secondaryMuscles: ["Fessiers", "Mollets"], equipment: ["Machine"], difficulty: "BEGINNER", detailedInstructions: "Marche rapide en pente, posture haute et foulée régulière.", isCompound: false },
  { slug: "jump-rope", name: "Jump Rope", category: "CARDIO_MOBILITY", movementType: "CARDIO", primaryMuscles: ["Cardio"], secondaryMuscles: ["Mollets", "Avant-bras"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Petits sauts réguliers, poignets actifs, épaules relâchées.", isCompound: false },
  { slug: "burpee", name: "Burpee", category: "CARDIO_MOBILITY", movementType: "PLYOMETRIC", primaryMuscles: ["Cardio global"], secondaryMuscles: ["Jambes", "Pectoraux", "Epaules"], equipment: ["Poids du corps"], difficulty: "INTERMEDIATE", detailedInstructions: "Mouvement fluide sol-debout-saut en conservant l’alignement du tronc.", isCompound: true },
  { slug: "mountain-climber", name: "Mountain Climber", category: "CARDIO_MOBILITY", movementType: "CARDIO", primaryMuscles: ["Core"], secondaryMuscles: ["Cardio", "Epaules"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Position planche solide, genoux alternés rapidement sans creuser le dos.", isCompound: false },
  { slug: "mobility-flow-hips", name: "Mobility Flow Hips", category: "CARDIO_MOBILITY", movementType: "MOBILITY", primaryMuscles: ["Mobilite hanches"], secondaryMuscles: ["Core"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Enchaîner les transitions lentement, chercher l’amplitude et la respiration.", isCompound: false },
  { slug: "couch-stretch", name: "Couch Stretch", category: "CARDIO_MOBILITY", movementType: "STRETCH", primaryMuscles: ["Fléchisseurs de hanche"], secondaryMuscles: ["Quadriceps"], equipment: ["Poids du corps"], difficulty: "BEGINNER", detailedInstructions: "Bassin rétroversé, tension progressive, respiration lente et profonde.", isCompound: false },
];

function buildMedia(slug: string): ExerciseCatalogMedia[] {
  const basePath = `/media/exercises/${slug}`;
  return [
    {
      type: "ANIMATION",
      format: "WEBP",
      storagePath: `media/exercises/${slug}/animation.webp`,
      publicUrl: `${basePath}/animation.webp`,
      mimeType: "image/webp",
      durationSeconds: 6,
      isLoop: true,
      sourceName: "fitai-placeholder",
      license: "internal",
      isPrimary: true,
      sortOrder: 1,
    },
    {
      type: "ANIMATION",
      format: "MP4",
      storagePath: `media/exercises/${slug}/animation.mp4`,
      publicUrl: `${basePath}/animation.mp4`,
      mimeType: "video/mp4",
      durationSeconds: 6,
      isLoop: true,
      sourceName: "fitai-placeholder",
      license: "internal",
      isPrimary: false,
      sortOrder: 2,
    },
    {
      type: "THUMBNAIL",
      format: "WEBP",
      storagePath: `media/exercises/${slug}/thumbnail.webp`,
      publicUrl: `${basePath}/thumbnail.webp`,
      mimeType: "image/webp",
      width: 640,
      height: 360,
      isPrimary: true,
      sortOrder: 1,
    },
    {
      type: "IMAGE",
      format: "WEBP",
      storagePath: `media/exercises/${slug}/image.webp`,
      publicUrl: `${basePath}/image.webp`,
      mimeType: "image/webp",
      width: 1280,
      height: 720,
      isPrimary: true,
      sortOrder: 1,
    },
  ];
}

export const exerciseCatalog: Array<ExerciseCatalogItem & { media: ExerciseCatalogMedia[] }> = exercisesBase.map((item) => ({
  ...item,
  objectives:
    item.category === "CARDIO_MOBILITY"
      ? ["ENDURANCE", "FAT_LOSS", "MOBILITY"]
      : item.isCompound
        ? ["STRENGTH", "MUSCLE_GAIN"]
        : ["MUSCLE_GAIN"],
  shortTechnicalCues: ["Amplitude propre", "Controle du tempo", "Respiration active"],
  commonMistakes: [
    "Charge trop lourde dès le départ",
    "Amplitude incomplète",
    "Perte de gainage en fin de série",
  ],
  variants: [`Version tempo lente de ${item.name}`, `Version unilatérale de ${item.name}`],
  alternatives: [`Alternative machine à ${item.name}`, `Alternative poids du corps à ${item.name}`],
  tags: [item.category, item.movementType, ...item.primaryMuscles.slice(0, 2)],
  contraindications: ["Douleur articulaire aiguë", "Blessure non rééduquée sur la zone ciblée"],
  media: buildMedia(item.slug),
}));
