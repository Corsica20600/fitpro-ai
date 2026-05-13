import Link from "next/link";
import { getProgressDataForDemoUser } from "@/src/server/fitness-queries";
import { PrimaryButton } from "@/src/components/ui/primary-button";

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "0 min";
  return `${Math.round(seconds / 60)} min`;
}

function formatDate(value: Date | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

export default async function ProgressPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const exerciseId = String(searchParams.exerciseId ?? "").trim();
  const data = await getProgressDataForDemoUser(exerciseId);

  return (
    <div className="stack">
      <section className="hero mini compact">
        <p className="eyebrow">Progression</p>
        <h1>Analyse des performances</h1>
      </section>

      <section className="card">
        <h2 className="section-title">Stats principales</h2>
        <div className="chips">
          <span className="chip">Seances semaine: {data.headline.weeklySessions}</span>
          <span className="chip">Volume semaine: {Math.round(data.headline.weeklyVolume)} kg</span>
          <span className="chip">Series totales: {data.headline.totalSets}</span>
          <span className="chip">Duree moyenne: {formatDuration(data.headline.averageDuration)}</span>
          <span className="chip">Exo le plus travaille: {data.headline.mostWorkedExercise}</span>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Progression par exercice</h2>
        <form method="get" className="form-grid">
          <select name="exerciseId" defaultValue={data.selectedExercise?.id ?? ""} className="input">
            {data.exerciseOptions.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
            ))}
          </select>
          <PrimaryButton type="submit">Afficher progression</PrimaryButton>
        </form>
        <div className="chips mt-10">
          <span className="chip">Meilleure charge: {data.progression.bestWeight.toFixed(1)} kg</span>
          <span className="chip">Meilleures reps: {data.progression.bestReps}</span>
          <span className="chip">Volume total: {Math.round(data.progression.totalVolume)} kg</span>
          <span className="chip">Derniere seance: {formatDate(data.progression.lastSessionAt)}</span>
          <span className="chip">Evolution: {data.progression.evolution}</span>
        </div>
      </section>

      <section className="card progress-records">
        <h2 className="section-title">Records personnels</h2>
        <div className="chips">
          <span className="chip">
            Record charge: {data.records.bestWeight ? `${data.records.bestWeight.value.toFixed(1)} kg (${data.records.bestWeight.exerciseName})` : "N/A"}
          </span>
          <span className="chip">
            Record volume exo: {data.records.bestExerciseVolume ? `${Math.round(data.records.bestExerciseVolume.volume)} kg (${data.records.bestExerciseVolume.name})` : "N/A"}
          </span>
          <span className="chip">
            Meilleure seance: {data.records.bestSession ? `${Math.round(data.records.bestSession.volume)} kg (${data.records.bestSession.title})` : "N/A"}
          </span>
        </div>
      </section>

      <section className="card">
        <h2 className="section-title">Historique compact</h2>
        <div className="stack">
          {data.recentSessions.length === 0 ? (
            <p className="muted">Aucune seance enregistree.</p>
          ) : (
            data.recentSessions.map((session) => (
              <Link key={session.id} href={`/history/${session.id}`} className="outline-link">
                {formatDate(session.date)} · {session.status === "COMPLETED" ? "Terminee" : "Brouillon"} · {session.setCount} series · {Math.round(session.volume)} kg
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <p className="muted">
          ProgressMetric: {data.progressMetricReady ? "structure prete, calcul serveur privilegie depuis WorkoutSet." : "non disponible."}
        </p>
      </section>
    </div>
  );
}
