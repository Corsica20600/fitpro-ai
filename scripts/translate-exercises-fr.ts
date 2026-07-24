import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODEL = "gpt-4o-mini";
const BATCH_SIZE = 8;
const CONCURRENCY = 4;
const MAX_RETRIES = 5;
const CHECKPOINT_FILE = path.join(__dirname, ".translate-fr-progress.json");

const SYSTEM_PROMPT = `Tu es un traducteur professionnel spécialisé en musculation et fitness.
Tu traduis de l'anglais vers le français, avec le vocabulaire réellement utilisé dans les salles de sport françaises.

Règles pour les NOMS d'exercices :
- Utilise le nom français consacré quand il existe : "Bench Press" -> "Développé couché", "Deadlift" -> "Soulevé de terre", "Lat Pulldown" -> "Tirage vertical", "Overhead Press" -> "Développé militaire", "Lunge" -> "Fente", "Calf Raise" -> "Extension mollets", "Push-Up" -> "Pompes", "Pull-Up" -> "Tractions".
- Conserve les termes anglais consacrés que l'usage français garde tels quels : Squat, Curl, Crunch, Hip Thrust, Kettlebell Swing, Burpees, Dips, Face Pull, Shrug, etc.
- Les précisions matérielles se traduisent : "Dumbbell" -> "haltères", "Barbell" -> "barre", "Cable" -> "poulie", "Machine" -> "machine", "Incline" -> "incliné", "Seated" -> "assis", "Standing" -> "debout".

Règles pour les INSTRUCTIONS et les ERREURS COURANTES :
- Traduction complète et naturelle, en vouvoiement à l'impératif ("Allongez-vous...", "Gardez le dos droit...").
- Aucun mot anglais résiduel sauf termes consacrés ci-dessus.
- Conserve le sens technique exact (angles, positions, consignes de sécurité).

Tu réponds UNIQUEMENT en JSON valide, de la forme :
{"translations":[{"id":"...","nameFr":"...","instructionsFr":"...","commonMistakesFr":["..."]}]}
- Un objet par exercice reçu, avec le même "id".
- "commonMistakesFr" doit contenir exactement autant d'éléments que la liste anglaise reçue (tableau vide si vide).`;

type ExerciseInput = {
  id: string;
  name: string;
  detailedInstructions: string;
  commonMistakes: string[];
};

type Translation = {
  id: string;
  nameFr: string;
  instructionsFr: string;
  commonMistakesFr: string[];
};

const usage = { promptTokens: 0, completionTokens: 0 };

function loadCheckpoint(): Set<string> {
  try {
    return new Set(JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8")) as string[]);
  } catch {
    return new Set();
  }
}

function saveCheckpoint(done: Set<string>) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify([...done]));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenAI(batch: ExerciseInput[]): Promise<Translation[]> {
  const payload = batch.map((e) => ({
    id: e.id,
    name: e.name,
    instructions: e.detailedInstructions,
    commonMistakes: e.commonMistakes,
  }));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify({ exercises: payload }) },
          ],
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
        }
        // Erreur non réessayable (clé invalide, quota épuisé...)
        console.error(`Erreur API définitive (HTTP ${response.status}): ${body.slice(0, 500)}`);
        process.exit(1);
      }

      const json = (await response.json()) as {
        choices: { message: { content: string } }[];
        usage?: { prompt_tokens: number; completion_tokens: number };
      };
      usage.promptTokens += json.usage?.prompt_tokens ?? 0;
      usage.completionTokens += json.usage?.completion_tokens ?? 0;

      const parsed = JSON.parse(json.choices[0].message.content) as { translations: Translation[] };
      const translations = parsed.translations;
      if (!Array.isArray(translations)) throw new Error("Réponse sans tableau 'translations'");

      const byId = new Map(translations.map((t) => [t.id, t]));
      for (const e of batch) {
        const t = byId.get(e.id);
        if (!t || !t.nameFr?.trim()) throw new Error(`Traduction manquante pour ${e.id} (${e.name})`);
        if (!Array.isArray(t.commonMistakesFr) || t.commonMistakesFr.length !== e.commonMistakes.length) {
          throw new Error(`commonMistakesFr invalide pour ${e.name}`);
        }
      }
      return batch.map((e) => byId.get(e.id)!);
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      const delay = 1000 * 2 ** attempt;
      console.warn(`Batch en échec (tentative ${attempt}/${MAX_RETRIES}), retry dans ${delay}ms: ${String(error).slice(0, 200)}`);
      await sleep(delay);
    }
  }
  throw new Error("unreachable");
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY manquante dans .env");
    process.exit(1);
  }

  const done = loadCheckpoint();
  const all = await prisma.exercise.findMany({
    select: { id: true, name: true, detailedInstructions: true, commonMistakes: true },
    orderBy: { name: "asc" },
  });
  const pending = all.filter((e) => !done.has(e.id));

  console.log(`${all.length} exercices au total, ${done.size} déjà traduits, ${pending.length} à traiter.`);

  const batches: ExerciseInput[][] = [];
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    batches.push(pending.slice(i, i + BATCH_SIZE));
  }

  let completedBatches = 0;
  let nextBatch = 0;
  const failed: string[] = [];

  async function translateBatch(batch: ExerciseInput[]): Promise<Translation[]> {
    try {
      return await callOpenAI(batch);
    } catch (error) {
      if (batch.length === 1) {
        console.error(`Échec définitif pour "${batch[0].name}": ${String(error).slice(0, 200)}`);
        failed.push(batch[0].name);
        return [];
      }
      // Le modèle fusionne parfois des exercices aux noms proches : repli exercice par exercice.
      console.warn(`Batch en échec, repli en traduction individuelle (${batch.length} exercices).`);
      const out: Translation[] = [];
      for (const e of batch) {
        out.push(...(await translateBatch([e])));
      }
      return out;
    }
  }

  async function worker() {
    while (true) {
      const index = nextBatch++;
      if (index >= batches.length) return;
      const batch = batches[index];
      const translations = await translateBatch(batch);
      for (const t of translations) {
        await prisma.exercise.update({
          where: { id: t.id },
          data: {
            nameFr: t.nameFr.trim(),
            instructionsFr: t.instructionsFr.trim(),
            commonMistakesFr: t.commonMistakesFr.map((m) => m.trim()),
          },
        });
        done.add(t.id);
      }
      saveCheckpoint(done);
      completedBatches += 1;
      if (completedBatches % 10 === 0 || completedBatches === batches.length) {
        console.log(`Progression: ${completedBatches}/${batches.length} batchs (${done.size}/${all.length} exercices)`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const cost = (usage.promptTokens * 0.15 + usage.completionTokens * 0.6) / 1_000_000;
  console.log(`Terminé. Tokens: ${usage.promptTokens} in / ${usage.completionTokens} out — coût estimé: $${cost.toFixed(3)}`);
  if (failed.length > 0) {
    console.warn(`${failed.length} exercice(s) non traduits: ${failed.join(", ")}`);
  }

  if (done.size >= all.length) {
    fs.rmSync(CHECKPOINT_FILE, { force: true });
    console.log("Checkpoint supprimé (traduction complète).");
  }
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
