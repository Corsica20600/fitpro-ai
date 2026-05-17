import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const DICT: Record<string, string> = {
  abdominals: "Abdominaux",
  abs: "Abdominaux",
  obliques: "Obliques",
  hamstrings: "Ischio-jambiers",
  quadriceps: "Quadriceps",
  glutes: "Fessiers",
  calves: "Mollets",
  adductors: "Adducteurs",
  abductors: "Abducteurs",
  chest: "Pectoraux",
  pectorals: "Pectoraux",
  lats: "Grand dorsal",
  "middle back": "Milieu du dos",
  "lower back": "Bas du dos",
  back: "Dos",
  shoulders: "Epaules",
  deltoids: "Deltoides",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Avant-bras",
  traps: "Trapezes",
  neck: "Cou",
  gluteus: "Fessiers",
  "body only": "Poids du corps",
  "bodyweight": "Poids du corps",
  "medicine ball": "Medecine ball",
  "foam roll": "Foam roller",
  "exercise ball": "Swiss ball",
  "e-z curl bar": "Barre EZ",
  "ez bar": "Barre EZ",
  "kettlebells": "Kettlebells",
  "dumbbell": "Halteres",
  "dumbbells": "Halteres",
  "barbell": "Barre",
  "barbells": "Barres",
  "cable": "Poulie",
  "machine": "Machine",
  "none": "Sans materiel",
  other: "Autre",
  bands: "Bandes elastiques",
};

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function translateOne(raw: string): string {
  const key = normalize(raw);
  if (!key) return raw;
  if (DICT[key]) return DICT[key];
  return toTitleCase(raw.replace(/[_-]+/g, " ").trim());
}

function uniq(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = normalize(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function main() {
  const exercises = await prisma.exercise.findMany({
    select: {
      id: true,
      primaryMuscles: true,
      equipment: true,
    },
  });

  let updated = 0;
  for (const exercise of exercises) {
    const primaryMusclesFr = uniq(exercise.primaryMuscles.map(translateOne));
    const equipmentFr = uniq(exercise.equipment.map(translateOne));

    await prisma.exercise.update({
      where: { id: exercise.id },
      data: { primaryMusclesFr, equipmentFr },
    });
    updated += 1;
  }

  console.log(`Traduction terminee: ${updated} exercices mis a jour.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
