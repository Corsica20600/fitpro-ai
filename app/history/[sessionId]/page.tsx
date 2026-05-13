import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkoutSessionDetailForDemoUser } from "@/src/server/fitness-queries";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "0 min";
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export default async function HistorySessionDetailPage(props: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await props.params;
  const data = await getWorkoutSessionDetailForDemoUser(sessionId);
  if (!data) notFound();

  const { session, exercises, totalVolume, totalSets, totalExercises } = data;

  return (
    <div className="stack">
      <section className="hero mini compact">
        <p className="eyebrow">Detail seance</p>
        <h1>{session.title}</h1>
        <p className="muted">{formatDate(session.startedAt ?? session.createdAt)}</p>
      </section>

      <section className="card">
        <div className="chips">
          <span className="chip">Statut: {session.status === "COMPLETED" ? "Terminee" : "Brouillon"}</span>
          <span className="chip">Duree: {formatDuration(session.durationSeconds)}</span>
          <span className="chip">Exercices: {totalExercises}</span>
          <span className="chip">Series: {totalSets}</span>
          <span className="chip">Volume total: {Math.round(totalVolume)} kg</span>
        </div>
      </section>

      <section className="stack">
        {exercises.map((exercise) => (
          <section key={exercise.exerciseId} className="card">
            <h2 className="section-title">{exercise.exerciseName}</h2>
            <p className="muted">{exercise.primaryMuscle}</p>
            <div className="chips">
              <span className="chip">Volume exo: {Math.round(exercise.totalVolume)} kg</span>
              <span className="chip">Series: {exercise.sets.length}</span>
            </div>
            <div className="stack mt-10">
              {exercise.sets.map((set) => (
                <div key={set.id} className="set-row">
                  <div className="set-row-left">Serie {set.setIndex}</div>
                  <div className="set-row-fields set-row-fields-3">
                    <input className="set-input set-input-readonly" readOnly value={set.reps ?? "-"} />
                    <input className="set-input set-input-readonly" readOnly value={set.weightKg ?? "-"} />
                    <input className="set-input set-input-readonly" readOnly value={Math.round(set.volume)} />
                  </div>
                  <span className="chip">kg</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="card action-stack">
        <Link href="/history" className="outline-link">Retour historique</Link>
        <Link href="/workout" className="primary-button">Demarrer une seance</Link>
      </section>
    </div>
  );
}
