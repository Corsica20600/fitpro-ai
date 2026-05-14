import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function arg(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.find((x) => x.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : null;
}

async function main() {
  const slug = arg("slug");
  const file = arg("file");
  const sourceName = arg("sourceName");
  const sourceUrl = arg("sourceUrl");
  const license = arg("license");

  if (!slug || !file) {
    throw new Error("Usage: npm run media:add-gif -- --slug=<slug> --file=<absolute-or-relative-path> [--sourceName=...] [--sourceUrl=...] [--license=...]");
  }

  const exercise = await prisma.exercise.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
  if (!exercise) {
    throw new Error(`Exercise not found for slug '${slug}'`);
  }

  const src = path.resolve(file);
  await fs.access(src);

  const targetDir = path.join(process.cwd(), "public", "media", "exercises", slug);
  await fs.mkdir(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, "animation.gif");
  await fs.copyFile(src, targetFile);

  const publicUrl = `/media/exercises/${slug}/animation.gif`;
  const storagePath = `media/exercises/${slug}/animation.gif`;

  await prisma.exercise.update({
    where: { id: exercise.id },
    data: {
      primaryAnimationPath: publicUrl,
      fallbackAnimationPath: publicUrl,
    },
  });

  await prisma.exerciseMedia.deleteMany({
    where: { exerciseId: exercise.id, type: "ANIMATION" },
  });

  await prisma.exerciseMedia.create({
    data: {
      exerciseId: exercise.id,
      type: "ANIMATION",
      format: "GIF",
      storagePath,
      publicUrl,
      url: publicUrl,
      mimeType: "image/gif",
      isLoop: true,
      isPrimary: true,
      sortOrder: 0,
      sourceName: sourceName || null,
      sourceUrl: sourceUrl || null,
      license: license || null,
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug,
        exerciseName: exercise.name,
        copiedTo: targetFile,
        publicUrl,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
