import { prisma } from "@/src/lib/prisma";
import { translateSentence, translateSimple, looksEnglish } from "@/src/lib/exercise-i18n";

type ExerciseRow = Awaited<ReturnType<typeof prisma.exercise.findMany>>[number];

const NAME_OVERRIDES: Record<string, string> = {
  "push-up": "Pompes",
  "lat pulldown": "Tirage vertical",
  "wide grip lat pulldown": "Tirage vertical",
  "wide-grip lat pulldown": "Tirage vertical",
  "incline dumbbell press": "Développé incliné haltères",
};

const EQUIPMENT_CANONICAL: Array<{ test: RegExp; value: string }> = [
  { test: /(barbell|barre|ez bar|smith)/i, value: "Barre" },
  { test: /(dumbbell|haltere|haltère|kettlebell)/i, value: "Haltères" },
  { test: /(machine|sled|bench machine)/i, value: "Machine" },
  { test: /(cable|poulie|pulley)/i, value: "Poulie" },
  { test: /(body|poids du corps|bodyweight|ring|rings)/i, value: "Poids du corps" },
];

const ALLOWED_EQUIPMENT = new Set(["Barre", "Haltères", "Machine", "Poulie", "Poids du corps"]);

function toTitleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupe(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = normalizeKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function standardizeEquipment(source: string[]) {
  const mapped = source
    .map((item) => {
      const value = item.trim();
      if (!value) return null;
      for (const rule of EQUIPMENT_CANONICAL) {
        if (rule.test.test(value)) return rule.value;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
  const unique = dedupe(mapped).filter((item) => ALLOWED_EQUIPMENT.has(item));
  return unique.length ? unique : ["Poids du corps"];
}

function standardizeNameFr(ex: ExerciseRow) {
  const seed = ex.nameFr?.trim() || ex.name.trim();
  const key = normalizeKey(seed);
  if (NAME_OVERRIDES[key]) return NAME_OVERRIDES[key];
  const translated = translateSimple(seed);
  return toTitleCase(translated.text);
}

function standardizeInstructionsFr(ex: ExerciseRow) {
  const current = ex.instructionsFr?.trim() || "";
  if (current && !looksEnglish(current)) return current;
  const translated = translateSentence(ex.detailedInstructions || "");
  const value = translated.text.trim();
  if (value && !looksEnglish(value)) return value;
  return `Exécute ${standardizeNameFr(ex).toLowerCase()} avec amplitude contrôlée, gainage actif et respiration régulière.`;
}

function standardizeCommonMistakesFr(ex: ExerciseRow) {
  const current = ex.commonMistakesFr
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (looksEnglish(item) ? translateSentence(item).text : item));
  const cleaned = dedupe(current);
  if (cleaned.length) return cleaned;

  switch (ex.category) {
    case "CHEST":
      return ["Amplitude incomplète", "Épaules qui montent", "Mouvement trop rapide"];
    case "BACK":
      return ["Tirer avec les bras uniquement", "Dos arrondi", "Amplitude incomplète"];
    case "LEGS":
      return ["Genoux qui rentrent", "Amplitude trop courte", "Perte de gainage"];
    case "SHOULDERS":
      return ["Élan excessif", "Haussement d’épaules", "Amplitude non contrôlée"];
    case "BICEPS":
    case "TRICEPS":
      return ["Coudes qui bougent", "Balancement du buste", "Amplitude incomplète"];
    case "ABS":
      return ["Tirer sur la nuque", "Perte de gainage", "Mouvement trop rapide"];
    default:
      return ["Mouvement trop rapide", "Amplitude incomplète", "Perte de contrôle"];
  }
}

function duplicateKey(ex: ExerciseRow, nameFr: string, equipmentFr: string[]) {
  return [
    normalizeKey(nameFr),
    ex.category,
    ex.movementType,
    normalizeKey(equipmentFr.join("|")),
  ].join("::");
}

async function repointAndDeactivateDuplicate(canonicalId: string, duplicateId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.programExercise.updateMany({
      where: { exerciseId: duplicateId },
      data: { exerciseId: canonicalId },
    });

    await tx.workoutSet.updateMany({
      where: { exerciseId: duplicateId },
      data: { exerciseId: canonicalId },
    });

    await tx.exerciseMedia.updateMany({
      where: { exerciseId: duplicateId },
      data: { exerciseId: canonicalId },
    });

    await tx.exercise.update({
      where: { id: duplicateId },
      data: { isActive: false },
    });
  });
}

async function main() {
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ createdAt: "asc" }],
  });

  let updated = 0;
  let merged = 0;
  const groups = new Map<string, string>();

  for (const ex of exercises) {
    const nameFr = standardizeNameFr(ex);
    const instructionsFr = standardizeInstructionsFr(ex);
    const commonMistakesFr = standardizeCommonMistakesFr(ex);
    const equipmentFr = standardizeEquipment(ex.equipmentFr.length ? ex.equipmentFr : ex.equipment);

    await prisma.exercise.update({
      where: { id: ex.id },
      data: {
        nameFr,
        instructionsFr,
        commonMistakesFr,
        equipmentFr,
      },
    });
    updated += 1;

    const key = duplicateKey(ex, nameFr, equipmentFr);
    const existingCanonicalId = groups.get(key);
    if (!existingCanonicalId) {
      groups.set(key, ex.id);
      continue;
    }
    if (existingCanonicalId === ex.id) continue;
    await repointAndDeactivateDuplicate(existingCanonicalId, ex.id);
    merged += 1;
  }

  console.log(`[standardize-exercises] updated=${updated} merged=${merged}`);
}

main()
  .catch((error) => {
    console.error("[standardize-exercises] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
