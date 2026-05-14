import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Row = {
  id: string;
  slug: string;
  name: string;
  media: Array<{
    type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
    format: string;
    publicUrl: string;
    storagePath: string;
  }>;
};

function isLocalPublicPath(url: string) {
  return url.startsWith("/media/") || url.startsWith("/public/");
}

async function localFileExistsFromPublicUrl(publicUrl: string) {
  const normalized = publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  const absolute = path.resolve("public", normalized.replace(/^public[\\/]/, ""));
  try {
    await fs.access(absolute);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const exercises = (await prisma.exercise.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      media: {
        select: {
          type: true,
          format: true,
          publicUrl: true,
          storagePath: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  })) as Row[];

  const missingVisuals: Array<{
    slug: string;
    name: string;
    reason: string;
    mediaCount: number;
  }> = [];

  const brokenLocalFiles: Array<{
    slug: string;
    name: string;
    type: string;
    format: string;
    publicUrl: string;
  }> = [];

  for (const ex of exercises) {
    const hasImage = ex.media.some((m) => m.type === "IMAGE" || m.type === "THUMBNAIL");
    const hasAnim = ex.media.some(
      (m) =>
        m.type === "ANIMATION" &&
        ["GIF", "WEBP", "MP4"].includes(String(m.format).toUpperCase()),
    );

    if (!hasImage && !hasAnim) {
      missingVisuals.push({
        slug: ex.slug,
        name: ex.name,
        reason: "no image/thumbnail and no animation (gif/webp/mp4)",
        mediaCount: ex.media.length,
      });
    }

    for (const media of ex.media) {
      if (!isLocalPublicPath(media.publicUrl)) continue;
      const exists = await localFileExistsFromPublicUrl(media.publicUrl);
      if (!exists) {
        brokenLocalFiles.push({
          slug: ex.slug,
          name: ex.name,
          type: media.type,
          format: media.format,
          publicUrl: media.publicUrl,
        });
      }
    }
  }

  const withMedia = exercises.length - missingVisuals.length;
  const coverage = exercises.length ? ((withMedia / exercises.length) * 100).toFixed(1) : "0.0";

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      totalExercises: exercises.length,
      withVisualMedia: withMedia,
      missingVisualMedia: missingVisuals.length,
      coveragePercent: coverage,
      brokenLocalMediaFiles: brokenLocalFiles.length,
    },
    missingVisuals,
    brokenLocalFiles,
  };

  const outPath = path.resolve("reports/exercises-missing-visuals.json");
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("Visual report generated:");
  console.log(`- Total exercices: ${report.totals.totalExercises}`);
  console.log(`- Avec image/gif/webp/mp4: ${report.totals.withVisualMedia}`);
  console.log(`- Sans image/gif/webp/mp4: ${report.totals.missingVisualMedia}`);
  console.log(`- Couverture: ${report.totals.coveragePercent}%`);
  console.log(`- Fichiers locaux medias manquants: ${report.totals.brokenLocalMediaFiles}`);
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
