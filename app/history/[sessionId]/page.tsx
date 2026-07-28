import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/src/components/ui/page-header";
import { GlassCard } from "@/src/components/ui/glass-card";
import { SectionTitle } from "@/src/components/ui/section-title";
import { SessionSummary } from "@/src/components/history/session-summary";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";
import { getWorkoutSessionDetailForDemoUser } from "@/src/server/fitness-queries";

export const metadata = privatePageMetadata(
  "Détail séance",
  "Détail privé d'une séance Traknio avec exercices, séries et volume.",
);

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Paris",
  }).format(date);
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "0 min";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`;
}

function formatKg(value: number | null | undefined) {
  if (value == null) return "-";
  return `${Math.round(value).toLocaleString("fr-FR")} kg`;
}

export default async function HistorySessionDetailPage(props: PageProps<"/history/[sessionId]">) {
  const { sessionId } = await props.params;
  const data = await getWorkoutSessionDetailForDemoUser(sessionId);
  if (!data) notFound();

  const { session, exercises, totalVolume, totalSets, totalExercises } = data;
  const bestExercise = exercises.slice().sort((a, b) => b.totalVolume - a.totalVolume)[0] ?? null;
  const bestSet = exercises
    .flatMap((exercise) => exercise.sets.map((set) => ({ ...set, exerciseName: exercise.exerciseName })))
    .sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))[0] ?? null;

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Détail séance"
        title={session.title}
        description={formatDate(session.startedAt ?? session.createdAt)}
      />

      <SessionSummary
        statusLabel={session.status === "COMPLETED" ? "Terminée" : "Brouillon"}
        durationLabel={formatDuration(session.durationSeconds)}
        volumeLabel={formatKg(totalVolume)}
        exerciseCount={totalExercises}
        setsCount={totalSets}
        notes={session.notes}
      />

      {(bestExercise || bestSet) ? (
        <GlassCard>
          <SectionTitle eyebrow="Records" title="Repères de la séance" />
          <div className="chips">
            {bestExercise ? <span className="chip warning">Meilleur volume: {bestExercise.exerciseName} · {formatKg(bestExercise.totalVolume)}</span> : null}
            {bestSet ? <span className="chip orange">Charge max: {bestSet.exerciseName} · {formatKg(bestSet.weightKg)}</span> : null}
          </div>
        </GlassCard>
      ) : null}

      <section className="stack">
        <SectionTitle eyebrow="Exercices" title="Séries enregistrées" />
        {exercises.length === 0 ? (
          <GlassCard>
            <p className="muted">Cette séance ne contient pas encore de séries enregistrées.</p>
          </GlassCard>
        ) : (
          exercises.map((exercise) => (
            <section key={exercise.exerciseId} className="history-detail-exercise">
              <div className="history-detail-exercise__head">
                <div>
                  <p className="eyebrow">{exercise.primaryMuscle}</p>
                  <h2>{exercise.exerciseName}</h2>
                </div>
                <span className="chip success">{formatKg(exercise.totalVolume)}</span>
              </div>
              <div className="history-set-list">
                {exercise.sets.map((set) => (
                  <div key={set.id} className="history-set-card">
                    <strong>Série {set.setIndex}</strong>
                    <span>{set.reps ?? "-"} reps</span>
                    <span>{formatKg(set.weightKg)}</span>
                    <span>{formatKg(set.volume)}</span>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </section>

      <section className="card action-stack">
        <Link href="/history" className="outline-link">Retour historique</Link>
        <Link href="/workout" className="primary-button premium-glow">Démarrer une séance</Link>
      </section>
    </div>
  );
}
