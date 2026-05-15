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
  const fallbackData = {
    exerciseOptions: [] as Array<{ id: string; name: string }>,
    selectedExercise: null as { id: string; name: string } | null,
    headline: {
      weeklySessions: 0,
      weeklyVolume: 0,
      totalSets: 0,
      averageDuration: 0,
      mostWorkedExercise: "N/A",
    },
    progression: {
      bestWeight: 0,
      bestReps: 0,
      totalVolume: 0,
      lastSessionAt: null as Date | null,
      evolution: "stable",
    },
    records: {
      bestWeight: null as { value: number; exerciseName: string } | null,
      bestExerciseVolume: null as { exerciseId: string; name: string; volume: number } | null,
      bestSession: null as { sessionId: string; title: string; volume: number } | null,
    },
    recentSessions: [] as Array<{ id: string; date: Date; status: string; setCount: number; volume: number }>,
    progressMetricReady: false,
  };
  const data = await getProgressDataForDemoUser(exerciseId).catch(() => fallbackData);
  const sessionsForChart = data.recentSessions.slice(0, 6).reverse();
  const maxVolume = Math.max(1, ...sessionsForChart.map((item) => item.volume));
  const donutWeight = Math.max(0, data.progression.bestWeight);
  const donutReps = Math.max(0, data.progression.bestReps);
  const donutVolume = Math.max(0, Math.round(data.progression.totalVolume / 40));
  const donutTotal = Math.max(1, donutWeight + donutReps + donutVolume);
  const weightPct = (donutWeight / donutTotal) * 100;
  const repsPct = (donutReps / donutTotal) * 100;
  const volumePct = 100 - weightPct - repsPct;
  const donutGradient = `conic-gradient(#5eb8ff 0 ${weightPct}%, #38e3a5 ${weightPct}% ${weightPct + repsPct}%, #9b7dff ${weightPct + repsPct}% 100%)`;

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

      <section className="card progress-visuals">
        <h2 className="section-title">Visualisation</h2>
        <div className="progress-visual-grid">
          <div className="progress-block">
            <p className="eyebrow">Dernieres seances</p>
            <div className="progress-bars">
              {sessionsForChart.length === 0 ? (
                <p className="muted">Pas assez de donnees.</p>
              ) : (
                sessionsForChart.map((session) => (
                  <div key={session.id} className="progress-bar-row">
                    <span>{formatDate(session.date)}</span>
                    <div className="progress-bar-track">
                      <i style={{ width: `${Math.max(8, (session.volume / maxVolume) * 100)}%` }} />
                    </div>
                    <strong>{Math.round(session.volume)} kg</strong>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="progress-block">
            <p className="eyebrow">Repartition</p>
            <div className="progress-donut-wrap">
              <div className="progress-donut" style={{ background: donutGradient }}>
                <div className="progress-donut-center">
                  <strong>{Math.round(data.progression.totalVolume)}kg</strong>
                  <span>Total</span>
                </div>
              </div>
              <div className="progress-legend">
                <span><i style={{ background: "#5eb8ff" }} /> Charge max</span>
                <span><i style={{ background: "#38e3a5" }} /> Reps max</span>
                <span><i style={{ background: "#9b7dff" }} /> Volume</span>
              </div>
            </div>
          </div>
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
