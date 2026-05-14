import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exercise.findMany({
    select: {
      id: true,
      media: {
        select: { type: true },
      },
    },
  });

  const totalExercises = exercises.length;
  let withImage = 0;
  let withThumbnail = 0;
  let withAnimation = 0;
  let withoutMedia = 0;

  for (const exercise of exercises) {
    const mediaTypes = new Set(exercise.media.map((item) => item.type));
    if (mediaTypes.has("IMAGE")) withImage += 1;
    if (mediaTypes.has("THUMBNAIL")) withThumbnail += 1;
    if (mediaTypes.has("ANIMATION")) withAnimation += 1;
    if (exercise.media.length === 0) withoutMedia += 1;
  }

  const withMedia = totalExercises - withoutMedia;
  const coveragePercent = totalExercises ? (withMedia / totalExercises) * 100 : 0;

  console.log("Exercise Media Coverage");
  console.log(`- Total exercices: ${totalExercises}`);
  console.log(`- Avec image: ${withImage}`);
  console.log(`- Avec thumbnail: ${withThumbnail}`);
  console.log(`- Avec animation: ${withAnimation}`);
  console.log(`- Sans media: ${withoutMedia}`);
  console.log(`- Avec media: ${withMedia}`);
  console.log(`- Couverture: ${coveragePercent.toFixed(1)}%`);
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
