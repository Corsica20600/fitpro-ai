import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import {
  PrismaClient,
  ExerciseCategory,
  ExerciseMovementType,
  ExerciseObjective,
  MediaFormat,
  MediaType,
  ProgramLevel,
} from "../src/generated/prisma/client";

const prisma = new PrismaClient();

type ImportMedia = {
  type: MediaType;
  format: MediaFormat;
  storagePath: string;
  publicUrl: string;
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  isLoop?: boolean;
  sourceName?: string;
  sourceUrl?: string;
  license?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

type ImportExercise = {
  slug: string;
  name: string;
  category: ExerciseCategory;
  movementType: ExerciseMovementType;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: ProgramLevel;
  objectives: ExerciseObjective[];
  shortTechnicalCues: string[];
  detailedInstructions: string;
  commonMistakes: string[];
  variants: string[];
  alternatives: string[];
  tags: string[];
  contraindications: string[];
  isCompound?: boolean;
  isActive?: boolean;
  primaryAnimationPath?: string;
  fallbackImagePath?: string;
  fallbackThumbnailPath?: string;
  fallbackAnimationPath?: string;
  media?: ImportMedia[];
};

type ImportReport = {
  sourceFile: string;
  totalRead: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ index: number; slug?: string; message: string }>;
  warnings: string[];
};

const REQUIRED_FIELDS = [
  "slug",
  "name",
  "category",
  "movementType",
  "difficulty",
  "primaryMuscles",
  "equipment",
  "detailedInstructions",
] as const;

const categorySet = new Set(Object.values(ExerciseCategory));
const movementSet = new Set(Object.values(ExerciseMovementType));
const difficultySet = new Set(Object.values(ProgramLevel));
const objectiveSet = new Set(Object.values(ExerciseObjective));

function parseArg(name: string, fallback: string): string {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!match) return fallback;
  return match.slice(name.length + 3);
}

function splitPipe(value: string | undefined): string[] {
  if (!value) return [];
  return value.split("|").map((v) => v.trim()).filter(Boolean);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return fallback;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function fromCsvRow(row: Record<string, string>): ImportExercise {
  const slug = row.slug?.trim();
  const basePath = `/media/exercises/${slug}`;
  const objectives = splitPipe(row.objectives).filter((v): v is ExerciseObjective => objectiveSet.has(v as ExerciseObjective));

  const media: ImportMedia[] = [
    {
      type: "ANIMATION",
      format: "WEBP",
      storagePath: row.animationStoragePath || `media/exercises/${slug}/animation.webp`,
      publicUrl: row.animationPublicUrl || `${basePath}/animation.webp`,
      mimeType: "image/webp",
      durationSeconds: 8,
      isLoop: true,
      isPrimary: true,
      sortOrder: 1,
    },
    {
      type: "THUMBNAIL",
      format: "WEBP",
      storagePath: row.thumbnailStoragePath || `media/exercises/${slug}/thumbnail.webp`,
      publicUrl: row.thumbnailPublicUrl || `${basePath}/thumbnail.webp`,
      mimeType: "image/webp",
      width: 480,
      height: 270,
      isPrimary: true,
      sortOrder: 1,
    },
  ];

  return {
    slug,
    name: row.name?.trim(),
    category: row.category?.trim() as ExerciseCategory,
    movementType: row.movementType?.trim() as ExerciseMovementType,
    primaryMuscles: splitPipe(row.primaryMuscles),
    secondaryMuscles: splitPipe(row.secondaryMuscles),
    equipment: splitPipe(row.equipment),
    difficulty: row.difficulty?.trim() as ProgramLevel,
    objectives: objectives.length ? objectives : ["MUSCLE_GAIN"],
    shortTechnicalCues: splitPipe(row.shortTechnicalCues),
    detailedInstructions: row.detailedInstructions?.trim(),
    commonMistakes: splitPipe(row.commonMistakes),
    variants: splitPipe(row.variants),
    alternatives: splitPipe(row.alternatives),
    tags: splitPipe(row.tags),
    contraindications: splitPipe(row.contraindications),
    isCompound: parseBoolean(row.isCompound, false),
    isActive: parseBoolean(row.isActive, true),
    primaryAnimationPath: row.primaryAnimationPath || `${basePath}/animation.webp`,
    fallbackImagePath: row.fallbackImagePath || `${basePath}/image.webp`,
    fallbackThumbnailPath: row.fallbackThumbnailPath || `${basePath}/thumbnail.webp`,
    fallbackAnimationPath: row.fallbackAnimationPath || `${basePath}/animation.webp`,
    media,
  };
}

function validate(ex: ImportExercise): string[] {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = ex[field];
    if (Array.isArray(value)) {
      if (!value.length) errors.push(`Missing required array field: ${field}`);
    } else if (!value || String(value).trim().length === 0) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (!categorySet.has(ex.category)) errors.push(`Invalid category: ${ex.category}`);
  if (!movementSet.has(ex.movementType)) errors.push(`Invalid movementType: ${ex.movementType}`);
  if (!difficultySet.has(ex.difficulty)) errors.push(`Invalid difficulty: ${ex.difficulty}`);

  if (ex.objectives.some((obj) => !objectiveSet.has(obj))) {
    errors.push("Invalid objective value");
  }

  return errors;
}

function normalizeJson(raw: unknown): ImportExercise[] {
  if (!Array.isArray(raw)) {
    throw new Error("JSON root must be an array of exercises");
  }
  return raw as ImportExercise[];
}

async function readImportFile(filePath: string): Promise<ImportExercise[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".json") {
    return normalizeJson(JSON.parse(content));
  }

  if (ext === ".csv") {
    const rows = parseCsv(content);
    return rows.map(fromCsvRow);
  }

  throw new Error("Unsupported file format. Use .json or .csv");
}

function defaultMedia(slug: string): ImportMedia[] {
  return [
    {
      type: "ANIMATION",
      format: "WEBP",
      storagePath: `media/exercises/${slug}/animation.webp`,
      publicUrl: `/media/exercises/${slug}/animation.webp`,
      mimeType: "image/webp",
      durationSeconds: 8,
      isLoop: true,
      isPrimary: true,
      sortOrder: 1,
    },
    {
      type: "THUMBNAIL",
      format: "WEBP",
      storagePath: `media/exercises/${slug}/thumbnail.webp`,
      publicUrl: `/media/exercises/${slug}/thumbnail.webp`,
      mimeType: "image/webp",
      width: 480,
      height: 270,
      isPrimary: true,
      sortOrder: 1,
    },
    {
      type: "IMAGE",
      format: "WEBP",
      storagePath: `media/exercises/${slug}/image.webp`,
      publicUrl: `/media/exercises/${slug}/image.webp`,
      mimeType: "image/webp",
      width: 1280,
      height: 720,
      isPrimary: true,
      sortOrder: 1,
    },
  ];
}

async function upsertExercise(ex: ImportExercise, report: ImportReport) {
  const existing = await prisma.exercise.findUnique({ where: { slug: ex.slug } });

  const payload = {
    name: ex.name,
    category: ex.category,
    movementType: ex.movementType,
    primaryMuscles: ex.primaryMuscles,
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment,
    difficulty: ex.difficulty,
    objectives: ex.objectives,
    shortTechnicalCues: ex.shortTechnicalCues,
    detailedInstructions: ex.detailedInstructions,
    commonMistakes: ex.commonMistakes,
    variants: ex.variants,
    alternatives: ex.alternatives,
    tags: ex.tags,
    contraindications: ex.contraindications,
    primaryAnimationPath: ex.primaryAnimationPath ?? `/media/exercises/${ex.slug}/animation.webp`,
    fallbackImagePath: ex.fallbackImagePath ?? `/media/exercises/${ex.slug}/image.webp`,
    fallbackThumbnailPath: ex.fallbackThumbnailPath ?? `/media/exercises/${ex.slug}/thumbnail.webp`,
    fallbackAnimationPath: ex.fallbackAnimationPath ?? `/media/exercises/${ex.slug}/animation.webp`,
    isCompound: ex.isCompound ?? false,
    isActive: ex.isActive ?? true,
  };

  const record = await prisma.exercise.upsert({
    where: { slug: ex.slug },
    update: payload,
    create: {
      slug: ex.slug,
      ...payload,
    },
  });

  const media = ex.media?.length ? ex.media : defaultMedia(ex.slug);
  await prisma.exerciseMedia.deleteMany({ where: { exerciseId: record.id } });
  await prisma.exerciseMedia.createMany({
    data: media.map((m) => ({
      exerciseId: record.id,
      ...m,
      url: m.url ?? m.publicUrl,
      isLoop: m.isLoop ?? false,
      isPrimary: m.isPrimary ?? false,
      sortOrder: m.sortOrder ?? 0,
    })),
  });

  if (existing) report.updated += 1;
  else report.created += 1;
}

async function main() {
  const file = parseArg("file", "exercises.import.example.json");
  const absFile = path.resolve(file);
  const report: ImportReport = {
    sourceFile: absFile,
    totalRead: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  };

  const data = await readImportFile(absFile);
  report.totalRead = data.length;

  const seen = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    const ex = data[i];
    const slug = ex.slug?.trim();

    if (!slug) {
      report.skipped += 1;
      report.errors.push({ index: i, message: "Missing slug" });
      continue;
    }

    if (seen.has(slug)) {
      report.skipped += 1;
      report.errors.push({ index: i, slug, message: "Duplicate slug in import file" });
      continue;
    }

    seen.add(slug);

    const errors = validate(ex);
    if (errors.length) {
      report.skipped += 1;
      report.errors.push({ index: i, slug, message: errors.join(" | ") });
      continue;
    }

    try {
      const possibleDuplicateName = await prisma.exercise.findFirst({
        where: {
          name: ex.name,
          NOT: { slug: ex.slug },
        },
        select: { slug: true },
      });

      if (possibleDuplicateName) {
        report.warnings.push(`Possible duplicate name '${ex.name}' with existing slug '${possibleDuplicateName.slug}'`);
      }

      await upsertExercise(ex, report);
    } catch (error) {
      report.skipped += 1;
      report.errors.push({
        index: i,
        slug,
        message: error instanceof Error ? error.message : "Unknown import error",
      });
    }
  }

  const reportPath = `${absFile}.report.json`;
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("Import finished:");
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${reportPath}`);
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

