import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { looksEnglish, translateList, translateSentence, translateSimple } from "../src/lib/exercise-i18n";

const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
  });

  const report = {
    exercisesProcessed: exercises.length,
    fieldsTranslated: 0,
    fieldsUntranslated: 0,
    updatedExercises: 0,
  };

  for (const exercise of exercises) {
    let changed = false;

    let nameFr = exercise.nameFr;
    if (!nameFr || !nameFr.trim() || nameFr.trim().toLowerCase() === exercise.name.trim().toLowerCase()) {
      const t = translateSimple(exercise.name);
      nameFr = t.text;
      if (t.translated) report.fieldsTranslated += 1;
      else report.fieldsUntranslated += 1;
      changed = true;
    }

    let instructionsFr = exercise.instructionsFr;
    if (
      !instructionsFr ||
      !instructionsFr.trim() ||
      instructionsFr.trim().toLowerCase() === exercise.detailedInstructions.trim().toLowerCase() ||
      looksEnglish(instructionsFr)
    ) {
      const t = translateSentence(exercise.detailedInstructions);
      instructionsFr = t.text;
      if (t.translated) report.fieldsTranslated += 1;
      else report.fieldsUntranslated += 1;
      changed = true;
    }

    let commonMistakesFr = exercise.commonMistakesFr;
    if (!commonMistakesFr?.length || commonMistakesFr.some((item) => looksEnglish(item))) {
      const translatedItems = exercise.commonMistakes.map((item) => translateSentence(item));
      commonMistakesFr = translatedItems.map((item) => item.text);
      const translatedCount = translatedItems.filter((item) => item.translated).length;
      report.fieldsTranslated += translatedCount;
      report.fieldsUntranslated += Math.max(0, exercise.commonMistakes.length - translatedCount);
      changed = true;
    }

    let primaryMusclesFr = exercise.primaryMusclesFr;
    if (!primaryMusclesFr?.length) {
      const t = translateList(exercise.primaryMuscles);
      primaryMusclesFr = t.items;
      report.fieldsTranslated += t.translatedCount;
      report.fieldsUntranslated += Math.max(0, exercise.primaryMuscles.length - t.translatedCount);
      changed = true;
    }

    let equipmentFr = exercise.equipmentFr;
    if (!equipmentFr?.length) {
      const t = translateList(exercise.equipment);
      equipmentFr = t.items;
      report.fieldsTranslated += t.translatedCount;
      report.fieldsUntranslated += Math.max(0, exercise.equipment.length - t.translatedCount);
      changed = true;
    }

    if (changed) {
      await prisma.exercise.update({
        where: { id: exercise.id },
        data: {
          nameFr,
          instructionsFr,
          commonMistakesFr,
          primaryMusclesFr,
          equipmentFr,
        },
      });
      report.updatedExercises += 1;
    }
  }

  console.log("Translation report:");
  console.log(`- Exercices traites: ${report.exercisesProcessed}`);
  console.log(`- Exercices mis a jour: ${report.updatedExercises}`);
  console.log(`- Champs traduits: ${report.fieldsTranslated}`);
  console.log(`- Champs non traduits: ${report.fieldsUntranslated}`);
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
