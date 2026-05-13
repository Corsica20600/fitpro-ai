import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  PrismaClient,
  ExerciseCategory,
  ExerciseMovementType,
  ExerciseObjective,
  MediaFormat,
  ProgramLevel,
} from "../src/generated/prisma/client";

type ExternalExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string | null;
  images: string[];
};

const prisma = new PrismaClient();

const SOURCE_NAME = "yuhonas/free-exercise-db";
const SOURCE_REPO_URL = "https://github.com/yuhonas/free-exercise-db";
const SOURCE_LICENSE = "Unlicense";
const EXTERNAL_DIR = path.resolve("data/external/free-exercise-db");
const EXTERNAL_JSON_DIR = path.join(EXTERNAL_DIR, "exercises");
const EXTERNAL_IMAGES_ROOT = path.join(EXTERNAL_DIR, "exercises");
const PUBLIC_MEDIA_ROOT = path.resolve("public/media/exercises");

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

function cloneOrPullRepo() {
  const hasGitDir = existsSync(path.join(EXTERNAL_DIR, ".git"));
  if (!existsSync(path.dirname(EXTERNAL_DIR))) {
    spawnSync("powershell", ["-NoProfile", "-Command", "New-Item -ItemType Directory -Force data/external | Out-Null"], {
      stdio: "inherit",
    });
  }

  if (!hasGitDir) {
    const clone = spawnSync("git", ["clone", "--depth", "1", SOURCE_REPO_URL, EXTERNAL_DIR], {
      stdio: "inherit",
    });
    if (clone.status !== 0) {
      throw new Error("Failed to clone free-exercise-db repository");
    }
    return;
  }

  const pull = spawnSync("git", ["-C", EXTERNAL_DIR, "pull", "--ff-only"], { stdio: "inherit" });
  if (pull.status !== 0) {
    throw new Error("Failed to pull latest free-exercise-db repository");
  }
}

function mapDifficulty(level: string | null): ProgramLevel {
  if (level === "advanced") return "ADVANCED";
  if (level === "intermediate") return "INTERMEDIATE";
  return "BEGINNER";
}

function mapMovementType(mechanic: string | null, category: string | null): ExerciseMovementType {
  if (mechanic === "compound") return "COMPOUND";
  if (mechanic === "isolation") return "ISOLATION";
  if (category === "cardio") return "CARDIO";
  if (category === "stretching") return "STRETCH";
  if (category === "plyometrics") return "PLYOMETRIC";
  if (category === "strongman") return "CARRY";
  return "ISOLATION";
}

function mapCategory(primaryMuscles: string[], category: string | null): ExerciseCategory {
  const muscles = primaryMuscles.map((item) => item.toLowerCase());
  if (muscles.some((m) => m.includes("chest") || m.includes("pectoral"))) return "CHEST";
  if (muscles.some((m) => m.includes("lats") || m.includes("middle back") || m.includes("lower back") || m.includes("traps"))) return "BACK";
  if (muscles.some((m) => m.includes("shoulder") || m.includes("deltoid"))) return "SHOULDERS";
  if (muscles.some((m) => m.includes("biceps") || m.includes("forearm"))) return "BICEPS";
  if (muscles.some((m) => m.includes("triceps"))) return "TRICEPS";
  if (muscles.some((m) => m.includes("quadriceps") || m.includes("hamstring") || m.includes("glute") || m.includes("calves") || m.includes("adductor") || m.includes("abductor"))) return "LEGS";
  if (muscles.some((m) => m.includes("abdominals") || m.includes("oblique"))) return "ABS";
  if (category === "cardio" || category === "plyometrics" || category === "stretching") return "CARDIO_MOBILITY";
  return "CARDIO_MOBILITY";
}

function mapObjectives(category: string | null): ExerciseObjective[] {
  if (category === "cardio") return ["ENDURANCE", "FAT_LOSS"];
  if (category === "stretching") return ["MOBILITY", "POSTURE"];
  if (category === "plyometrics") return ["POWER", "FAT_LOSS"];
  return ["STRENGTH", "MUSCLE_GAIN"];
}

function mapEquipment(equipment: string | null): string[] {
  if (!equipment || equipment === "none") return ["Poids du corps"];
  if (equipment === "body only") return ["Poids du corps"];
  if (equipment === "machine") return ["Machine"];
  if (equipment === "barbell") return ["Barre"];
  if (equipment === "dumbbell") return ["Halteres"];
  if (equipment === "cable") return ["Poulie"];
  return [equipment];
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toMediaFormat(ext: string): MediaFormat {
  const normalized = ext.toLowerCase();
  if (normalized === ".jpg" || normalized === ".jpeg") return "JPG";
  if (normalized === ".png") return "PNG";
  if (normalized === ".webp") return "WEBP";
  if (normalized === ".gif") return "GIF";
  if (normalized === ".mp4") return "MP4";
  return "OTHER";
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function importOne(ex: ExternalExercise) {
  const slug = slugify(ex.id || ex.name);
  if (!slug) return { status: "skipped" as const, reason: "empty slug" };

  const targetDir = path.join(PUBLIC_MEDIA_ROOT, slug);
  await ensureDir(targetDir);

  const copied: Array<{ src: string; dst: string }> = [];
  for (const rel of ex.images ?? []) {
    const sourcePath = path.join(EXTERNAL_IMAGES_ROOT, rel);
    const fileName = path.basename(rel);
    const targetPath = path.join(targetDir, fileName);
    if (!existsSync(sourcePath)) continue;
    await fs.copyFile(sourcePath, targetPath);
    copied.push({ src: sourcePath, dst: targetPath });
  }

  const firstImage = copied[0] ? path.basename(copied[0].dst) : null;
  const secondImage = copied[1] ? path.basename(copied[1].dst) : firstImage;

  const fallbackThumb = firstImage ? `/media/exercises/${slug}/${firstImage}` : "/media/exercises/fallback-thumb.svg";
  const fallbackImage = secondImage ? `/media/exercises/${slug}/${secondImage}` : fallbackThumb;
  const fallbackAnim = firstImage ? `/media/exercises/${slug}/${firstImage}` : "/media/exercises/fallback-anim.svg";

  const primaryMuscles = [...(ex.primaryMuscles ?? []).map(toTitleCase)];
  const secondaryMuscles = [...(ex.secondaryMuscles ?? []).map(toTitleCase)];
  const equipment = [...mapEquipment(ex.equipment)];
  const instructions = [...(ex.instructions ?? [])];
  const commonMistakes = [
    "Aller trop vite sans controle",
    "Amplitude incomplete",
    "Mauvais gainage",
  ];
  const tags = [ex.category ?? "general", ex.force ?? "unknown", ...(ex.primaryMuscles ?? [])].map((t) => t.toLowerCase());

  const payload = {
    name: ex.name.trim(),
    category: mapCategory(ex.primaryMuscles ?? [], ex.category),
    movementType: mapMovementType(ex.mechanic, ex.category),
    primaryMuscles,
    secondaryMuscles,
    equipment,
    difficulty: mapDifficulty(ex.level),
    objectives: mapObjectives(ex.category),
    shortTechnicalCues: [...instructions.slice(0, 3).map((line) => line.slice(0, 120))],
    detailedInstructions: instructions.join(" "),
    commonMistakes,
    variants: [] as string[],
    alternatives: [] as string[],
    tags,
    contraindications: [] as string[],
    primaryAnimationPath: fallbackAnim,
    fallbackImagePath: fallbackImage,
    fallbackThumbnailPath: fallbackThumb,
    fallbackAnimationPath: fallbackAnim,
    isCompound: ex.mechanic === "compound",
    isActive: true,
  };

  const existing = await prisma.exercise.findUnique({ where: { slug }, select: { id: true } });
  const record = await prisma.exercise.upsert({
    where: { slug },
    update: payload,
    create: { slug, ...payload },
  });

  await prisma.exerciseMedia.deleteMany({ where: { exerciseId: record.id } });

  if (copied.length > 0) {
    await prisma.exerciseMedia.createMany({
      data: copied.map((file, idx) => {
        const ext = path.extname(file.dst);
        const relStorage = path.relative(path.resolve("public"), file.dst).replaceAll("\\", "/");
        const publicUrl = `/${relStorage}`;
        return {
          exerciseId: record.id,
          type: idx === 0 ? "THUMBNAIL" : "IMAGE",
          format: toMediaFormat(ext),
          storagePath: relStorage,
          publicUrl,
          url: publicUrl,
          sourceName: SOURCE_NAME,
          sourceUrl: SOURCE_REPO_URL,
          license: SOURCE_LICENSE,
          isPrimary: idx === 0,
          sortOrder: idx,
          mimeType: undefined,
          isLoop: false,
        };
      }),
    });
  }

  return { status: existing ? ("updated" as const) : ("created" as const), slug, images: copied.length };
}

async function main() {
  cloneOrPullRepo();
  const entries = await fs.readdir(EXTERNAL_JSON_DIR, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => path.join(EXTERNAL_JSON_DIR, entry.name));

  const external: ExternalExercise[] = [];
  for (const file of jsonFiles) {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as ExternalExercise | ExternalExercise[];
    if (Array.isArray(parsed)) external.push(...parsed);
    else external.push(parsed);
  }

  const report = {
    source: SOURCE_NAME,
    license: SOURCE_LICENSE,
    sourceRepo: SOURCE_REPO_URL,
    total: external.length,
    created: 0,
    updated: 0,
    skipped: 0,
    copiedImages: 0,
    errors: [] as Array<{ id: string; reason: string }>,
  };

  console.log(`[free-exercise-db] JSON files found: ${jsonFiles.length}`);
  console.log(`[free-exercise-db] Exercises read: ${external.length}`);

  for (const item of external) {
    try {
      const result = await importOne(item);
      if (result.status === "created") report.created += 1;
      else if (result.status === "updated") report.updated += 1;
      else report.skipped += 1;
      if ("images" in result) report.copiedImages += result.images ?? 0;
    } catch (error) {
      report.skipped += 1;
      report.errors.push({
        id: item.id,
        reason: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  const reportPath = path.resolve("data/external/free-exercise-db.import.report.json");
  await ensureDir(path.dirname(reportPath));
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`[free-exercise-db] Exercises imported: ${report.created + report.updated}`);
  console.log(`Import done from ${SOURCE_NAME}`);
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath}`);
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
