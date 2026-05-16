import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseVisual } from "@/src/components/exercise/exercise-visual";
import { AddToProgramForm } from "@/src/components/exercise/add-to-program-form";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { categoryToFr, levelToFr } from "@/src/lib/exercise-i18n";
import { addExerciseToProgramDayAction } from "@/src/server/fitness-actions";
import { getExerciseBySlug, getProgramsForDemoUser } from "@/src/server/fitness-queries";
import { looksEnglish, translateSentence, translateSimple } from "@/src/lib/exercise-i18n";
import { getExerciseOverride } from "@/src/lib/exercise-overrides";

const DIPS_GUIDE_SLUGS = new Set([
  "dips-assistes",
  "dips-chest-version",
  "dip-machine",
  "parallel-bar-dip",
]);

function uniqueText(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase("fr");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export default async function ExerciseDetailPage(props: PageProps<"/exercises/[slug]">) {
  const { slug } = await props.params;
  const [exercise, programs] = await Promise.all([
    getExerciseBySlug(slug),
    getProgramsForDemoUser(),
  ]);

  if (!exercise) notFound();
  const override = getExerciseOverride(exercise.slug);
  const displayName = override?.displayNameFr || exercise.nameFr || exercise.name;

  const primaryMuscles = uniqueText(exercise.primaryMusclesFr.length ? exercise.primaryMusclesFr : exercise.primaryMuscles);
  const secondaryMuscles = uniqueText(exercise.secondaryMuscles.map((item) => translateSimple(item).text));
  const equipment = uniqueText(exercise.equipmentFr.length ? exercise.equipmentFr : exercise.equipment);
  const instructions = exercise.instructionsFr && !looksEnglish(exercise.instructionsFr)
    ? exercise.instructionsFr
    : translateSentence(exercise.detailedInstructions).text;
  const commonMistakesRaw = uniqueText(
    (exercise.commonMistakesFr.length ? exercise.commonMistakesFr : exercise.commonMistakes)
      .map((item) => (looksEnglish(item) ? translateSentence(item).text : item)),
  );
  const isDipsGuide = DIPS_GUIDE_SLUGS.has(exercise.slug);
  const commonMistakes = uniqueText(isDipsGuide
    ? [
      "Rester droit (triceps uniquement)",
      "Descendre à moitié",
      "Épaules qui montent",
      "Trop d'assistance",
      "Coudes collés au corps",
    ]
    : commonMistakesRaw);

  const firstProgram = programs[0] ?? null;
  const keyPoints = uniqueText((isDipsGuide
    ? [
      "Buste penché vers l'avant (clé pour les pectoraux)",
      "Coudes légèrement ouverts",
      "Descente profonde",
      "Épaules basses et stables",
      "Contrôle du mouvement",
    ]
    : (exercise.shortTechnicalCues.length ? exercise.shortTechnicalCues : instructions.split(/[.!?]\s+/))))
    .map((item) => item.trim())
    .slice(0, 5);
  const stepTexts = uniqueText((isDipsGuide
    ? [
      "Buste penché vers l'avant. Poignées saisies. Épaules basses et stables. Regard vers le bas.",
      "Descendez lentement. Écartez légèrement les coudes.",
      "Atteignez le point le plus bas et sentez l'étirement dans les pectoraux.",
      "Remontez en poussant avec les pectoraux. Contraction en haut sans verrouiller les bras.",
      "Revenez à la position de départ en gardant la tension sur les pectoraux.",
    ]
    : instructions
    .split(/[.!?]\s+/)
    .map((item) => item.trim())
    .filter(Boolean)))
    .slice(0, 5);
  const stepTitles = ["Position de départ", "Descente", "Étirement bas", "Remontée", "Contraction finale"];
  const tipItems = uniqueText([
    ...(isDipsGuide
      ? [
        "Assistance modérée (ni trop facile, ni trop lourd)",
        "8 à 15 répétitions",
        "Tempo: descente lente (2-3 sec), remontée contrôlée",
      ]
      : []),
    `Niveau: ${levelToFr(exercise.difficulty)}`,
    `Matériel: ${equipment.join(" · ") || "Poids du corps"}`,
    `Objectif: ${categoryToFr(exercise.category)}`,
    "Respiration: inspire en descente, expire en remontée",
  ]);
  const visualGuideImage = isDipsGuide ? "/media/guides/dips-assistes-machine-pectoreaux.png" : null;
  const detailInfographic = override?.detailImage || visualGuideImage;

  return (
    <div className="stack exercise-detail-screen">
      <section className="card exercise-pro-header">
        <p className="exercise-pro-brand">FitAI Pro</p>
        <h1>
          {displayName} <span>{primaryMuscles[0] || "Full body"}</span>
        </h1>
        <p className="exercise-pro-subtitle">
          Technique parfaite pour cibler {primaryMuscles[0]?.toLowerCase() || "les muscles visés"}
        </p>
      </section>

      <section className="card">
        <ExerciseVisual
          media={exercise.media as never}
          fallbackAnimation={exercise.fallbackAnimationPath}
          fallbackImage={override?.cardImage || exercise.fallbackImagePath}
          frameAnimationUrls={override?.frameAnimationUrls}
          frameIntervalMs={override?.frameIntervalMs ?? 700}
          title={displayName}
        />
        <div className="exercise-header-text">
          <p className="eyebrow">{categoryToFr(exercise.category)} · {levelToFr(exercise.difficulty)}</p>
          <h1>{displayName}</h1>
          <p className="muted">{primaryMuscles.join(" · ") || "Full body"}</p>
        </div>
      </section>
      {detailInfographic ? (
        <section className="card">
          <p className="eyebrow">Guide visuel complet</p>
          <img
            src={detailInfographic}
            alt={`Guide visuel complet ${displayName}`}
            className="exercise-guide-infographic"
          />
        </section>
      ) : null}

      <section className="exercise-steps-grid">
        {stepTitles.map((title, idx) => (
          <article key={title} className="card exercise-step-card">
            <div className="exercise-step-badge">{idx + 1}</div>
            <p className="exercise-step-title">{title}</p>
            <p className="muted">{stepTexts[idx] || instructions}</p>
          </article>
        ))}
      </section>

      <section className="exercise-pro-panels">
        <article className="card">
          <h3>Points clés</h3>
          <ul className="detail-list">
            {keyPoints.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article className="card">
          <h3>Muscles sollicités</h3>
          <p><strong>Principaux:</strong> {primaryMuscles.join(" · ") || "Full body"}</p>
          <p><strong>Secondaires:</strong> {secondaryMuscles.join(" · ") || "Aucun"}</p>
        </article>
        <article className="card">
          <h3>Réglages & conseils</h3>
          <ul className="detail-list">
            {tipItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article className="card">
          <h3>Erreurs à éviter</h3>
          <ul className="detail-list">
            {(commonMistakes.length ? commonMistakes : ["Mouvement trop rapide", "Amplitude incomplète", "Perte de contrôle"]).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>

      <section className="card action-stack">
        {programs.length === 0 || !firstProgram ? (
          <div className="stack">
            <p className="muted">Cree d&apos;abord un programme pour ajouter cet exercice.</p>
            <Link href="/programs">
              <PrimaryButton>Creer un programme</PrimaryButton>
            </Link>
          </div>
        ) : (
          <AddToProgramForm
            exerciseId={exercise.id}
            programs={programs.map((program) => ({
              id: program.id,
              name: program.name,
              days: program.days.map((day) => ({
                id: day.id,
                dayIndex: day.dayIndex,
                title: day.title,
              })),
            }))}
            action={addExerciseToProgramDayAction}
          />
        )}
        <Link href="/exercises" className="outline-link">Retour catalogue</Link>
      </section>
    </div>
  );
}
