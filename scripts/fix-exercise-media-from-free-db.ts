import "dotenv/config";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient, MediaFormat } from "@prisma/client";

const prisma = new PrismaClient();

const EXTERNAL_ROOT = path.resolve("data/external/free-exercise-db/exercises");
const PUBLIC_ROOT = path.resolve("public/media/exercises");

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toMediaFormat(fileName: string): MediaFormat {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "JPG";
  if (ext === ".png") return "PNG";
  if (ext === ".webp") return "WEBP";
  if (ext === ".gif") return "GIF";
  if (ext === ".mp4") return "MP4";
  return "OTHER";
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  if (!existsSync(EXTERNAL_ROOT)) {
    throw new Error(`Missing free-exercise-db directory: ${EXTERNAL_ROOT}`);
  }

  const sourceDirs = await fs.readdir(EXTERNAL_ROOT, { withFileTypes: true });
  const sourceMap = new Map<string, string>();
  for (const d of sourceDirs) {
    if (!d.isDirectory()) continue;
    sourceMap.set(slugify(d.name), path.join(EXTERNAL_ROOT, d.name));
  }

  const exercises = await prisma.exercise.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
  });

  const report = {
    totalExercises: exercises.length,
    matchedDirectories: 0,
    updatedExercises: 0,
    copiedFiles: 0,
    noSourceDir: [] as string[],
    noImagesInSource: [] as string[],
  };

  for (const ex of exercises) {
    const srcDir = sourceMap.get(ex.slug);
    if (!srcDir) {
      report.noSourceDir.push(ex.slug);
      continue;
    }
    report.matchedDirectories += 1;

    const files = (await fs.readdir(srcDir))
      .filter((f) => /\.(jpg|jpeg|png|webp|gif|mp4)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, "en"));

    if (!files.length) {
      report.noImagesInSource.push(ex.slug);
      continue;
    }

    const targetDir = path.join(PUBLIC_ROOT, ex.slug);
    await ensureDir(targetDir);

    for (const file of files) {
      await fs.copyFile(path.join(srcDir, file), path.join(targetDir, file));
      report.copiedFiles += 1;
    }

    const thumb = files[0];
    const image = files[1] ?? files[0];
    const thumbUrl = `/media/exercises/${ex.slug}/${thumb}`;
    const imageUrl = `/media/exercises/${ex.slug}/${image}`;

    await prisma.exercise.update({
      where: { id: ex.id },
      data: {
        fallbackThumbnailPath: thumbUrl,
        fallbackImagePath: imageUrl,
        fallbackAnimationPath: thumbUrl,
        primaryAnimationPath: thumbUrl,
      },
    });

    await prisma.exerciseMedia.deleteMany({ where: { exerciseId: ex.id } });
    await prisma.exerciseMedia.createMany({
      data: files.map((file, idx) => {
        const publicUrl = `/media/exercises/${ex.slug}/${file}`;
        return {
          exerciseId: ex.id,
          type: idx === 0 ? "THUMBNAIL" : "IMAGE",
          format: toMediaFormat(file),
          storagePath: `media/exercises/${ex.slug}/${file}`,
          publicUrl,
          url: publicUrl,
          sourceName: "yuhonas/free-exercise-db",
          sourceUrl: "https://github.com/yuhonas/free-exercise-db",
          license: "Unlicense",
          isPrimary: idx === 0,
          sortOrder: idx,
          isLoop: false,
        };
      }),
    });

    report.updatedExercises += 1;
  }

  const outPath = path.resolve("reports/fix-exercise-media-from-free-db.report.json");
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("Media fix completed:");
  console.log(`- Exercices total: ${report.totalExercises}`);
  console.log(`- Dossiers source trouves: ${report.matchedDirectories}`);
  console.log(`- Exercices medias reparés: ${report.updatedExercises}`);
  console.log(`- Fichiers copies: ${report.copiedFiles}`);
  console.log(`- Sans dossier source: ${report.noSourceDir.length}`);
  console.log(`- Dossiers sans image: ${report.noImagesInSource.length}`);
  console.log(`- Rapport: ${outPath}`);
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
