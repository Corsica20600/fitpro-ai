import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { exerciseCatalog } from "./exercises.catalog";

const prisma = new PrismaClient();

async function upsertExercise(record: (typeof exerciseCatalog)[number]) {
  const fallbackBase = `/media/exercises/${record.slug}`;

  const exercise = await prisma.exercise.upsert({
    where: { slug: record.slug },
    update: {
      name: record.name,
      category: record.category,
      movementType: record.movementType,
      primaryMuscles: record.primaryMuscles,
      secondaryMuscles: record.secondaryMuscles,
      equipment: record.equipment,
      difficulty: record.difficulty,
      objectives: record.objectives,
      shortTechnicalCues: record.shortTechnicalCues,
      detailedInstructions: record.detailedInstructions,
      commonMistakes: record.commonMistakes,
      variants: record.variants,
      alternatives: record.alternatives,
      tags: record.tags,
      contraindications: record.contraindications,
      primaryAnimationPath: `${fallbackBase}/animation.webp`,
      fallbackImagePath: `${fallbackBase}/image.webp`,
      fallbackThumbnailPath: `${fallbackBase}/thumbnail.webp`,
      fallbackAnimationPath: `${fallbackBase}/animation.webp`,
      isCompound: record.isCompound,
      isActive: true,
    },
    create: {
      slug: record.slug,
      name: record.name,
      category: record.category,
      movementType: record.movementType,
      primaryMuscles: record.primaryMuscles,
      secondaryMuscles: record.secondaryMuscles,
      equipment: record.equipment,
      difficulty: record.difficulty,
      objectives: record.objectives,
      shortTechnicalCues: record.shortTechnicalCues,
      detailedInstructions: record.detailedInstructions,
      commonMistakes: record.commonMistakes,
      variants: record.variants,
      alternatives: record.alternatives,
      tags: record.tags,
      contraindications: record.contraindications,
      primaryAnimationPath: `${fallbackBase}/animation.webp`,
      fallbackImagePath: `${fallbackBase}/image.webp`,
      fallbackThumbnailPath: `${fallbackBase}/thumbnail.webp`,
      fallbackAnimationPath: `${fallbackBase}/animation.webp`,
      isCompound: record.isCompound,
      isActive: true,
    },
  });

  await prisma.exerciseMedia.deleteMany({ where: { exerciseId: exercise.id } });

  if (record.media.length) {
    await prisma.exerciseMedia.createMany({
      data: record.media.map((media) => ({
        exerciseId: exercise.id,
        ...media,
        url: media.publicUrl,
      })),
    });
  }
}

async function main() {
  for (const record of exerciseCatalog) {
    await upsertExercise(record);
  }

  console.log(`Seed complete: ${exerciseCatalog.length} exercises upserted and media synchronized.`);
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
