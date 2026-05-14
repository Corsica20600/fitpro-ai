import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getArg(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : null;
}

function mediaFormatFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".gif":
      return { format: "GIF" as const, mimeType: "image/gif", isLoop: true };
    case ".png":
      return { format: "PNG" as const, mimeType: "image/png", isLoop: false };
    case ".jpg":
    case ".jpeg":
      return { format: "JPG" as const, mimeType: "image/jpeg", isLoop: false };
    case ".webp":
      return { format: "WEBP" as const, mimeType: "image/webp", isLoop: false };
    case ".mp4":
      return { format: "MP4" as const, mimeType: "video/mp4", isLoop: true };
    case ".svg":
      return { format: "SVG" as const, mimeType: "image/svg+xml", isLoop: false };
    default:
      return { format: "OTHER" as const, mimeType: null, isLoop: false };
  }
}

async function copyToPublicMedia(slug: string, sourcePath: string, targetFileName: string) {
  const resolvedSource = path.resolve(sourcePath);
  await fs.access(resolvedSource);

  const targetDir = path.join(process.cwd(), "public", "media", "exercises", slug);
  await fs.mkdir(targetDir, { recursive: true });

  const targetAbsolute = path.join(targetDir, targetFileName);
  await fs.copyFile(resolvedSource, targetAbsolute);

  const publicUrl = `/media/exercises/${slug}/${targetFileName}`;
  const storagePath = `media/exercises/${slug}/${targetFileName}`;

  return { targetAbsolute, publicUrl, storagePath };
}

async function upsertMedia(args: {
  exerciseId: string;
  type: "IMAGE" | "THUMBNAIL" | "ANIMATION";
  filePath: string;
  slug: string;
  sourceName: string | null;
  sourceUrl: string | null;
  license: string | null;
}) {
  const ext = path.extname(args.filePath).toLowerCase();
  const targetName =
    args.type === "IMAGE" ? `image${ext}` : args.type === "THUMBNAIL" ? `thumb${ext}` : `animation${ext}`;

  const copied = await copyToPublicMedia(args.slug, args.filePath, targetName);
  const meta = mediaFormatFromPath(copied.targetAbsolute);

  await prisma.exerciseMedia.deleteMany({
    where: {
      exerciseId: args.exerciseId,
      type: args.type,
    },
  });

  await prisma.exerciseMedia.create({
    data: {
      exerciseId: args.exerciseId,
      type: args.type,
      format: meta.format,
      storagePath: copied.storagePath,
      publicUrl: copied.publicUrl,
      url: copied.publicUrl,
      mimeType: meta.mimeType,
      isLoop: meta.isLoop,
      isPrimary: true,
      sortOrder: 0,
      sourceName: args.sourceName,
      sourceUrl: args.sourceUrl,
      license: args.license,
    },
  });

  return copied.publicUrl;
}

async function main() {
  const slug = getArg("slug");
  const imageFile = getArg("imageFile");
  const thumbFile = getArg("thumbFile");
  const animationFile = getArg("animationFile");
  const sourceName = getArg("sourceName");
  const sourceUrl = getArg("sourceUrl");
  const license = getArg("license");

  if (!slug || (!imageFile && !thumbFile && !animationFile)) {
    throw new Error(
      [
        "Usage:",
        "npm run media:add -- --slug=<slug> [--imageFile=<path>] [--thumbFile=<path>] [--animationFile=<path>]",
        "[--sourceName=...] [--sourceUrl=...] [--license=...]",
      ].join(" "),
    );
  }

  const exercise = await prisma.exercise.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!exercise) {
    throw new Error(`Exercise not found for slug '${slug}'`);
  }

  const mediaPayload = {
    exerciseId: exercise.id,
    slug: exercise.slug,
    sourceName: sourceName || null,
    sourceUrl: sourceUrl || null,
    license: license || null,
  };

  const imageUrl = imageFile
    ? await upsertMedia({
        ...mediaPayload,
        type: "IMAGE",
        filePath: imageFile,
      })
    : null;
  const thumbUrl = thumbFile
    ? await upsertMedia({
        ...mediaPayload,
        type: "THUMBNAIL",
        filePath: thumbFile,
      })
    : null;
  const animationUrl = animationFile
    ? await upsertMedia({
        ...mediaPayload,
        type: "ANIMATION",
        filePath: animationFile,
      })
    : null;

  await prisma.exercise.update({
    where: { id: exercise.id },
    data: {
      ...(imageUrl ? { fallbackImagePath: imageUrl } : {}),
      ...(thumbUrl ? { fallbackThumbnailPath: thumbUrl } : {}),
      ...(animationUrl ? { fallbackAnimationPath: animationUrl, primaryAnimationPath: animationUrl } : {}),
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: exercise.slug,
        exerciseName: exercise.name,
        updated: {
          image: imageUrl,
          thumbnail: thumbUrl,
          animation: animationUrl,
        },
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
