import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { getHistoryVisualFallback, getWorkoutHistorySummaryForDemoUser } from "@/src/server/fitness-queries";

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

export default async function HistoryPage() {
  await connection();
  const [{ sessions, stats }, historyVisual] = await Promise.all([
    getWorkoutHistorySummaryForDemoUser(),
    getHistoryVisualFallback(),
  ]);

  return (
    <div className="stack">
      <section className="hero mini compact">
        <p className="eyebrow">Historique</p>
        <h1>{sessions.length} seances enregistrees</h1>
      </section>

      <section className="card">
        <h2 className="section-title">Stats semaine</h2>
        <div className="chips">
          <span className="chip">Volume: {Math.round(stats.weeklyVolume)} kg</span>
          <span className="chip">Seances: {stats.weeklySessionsCount}</span>
          <span className="chip">
            Meilleure: {stats.bestRecentSession ? `${Math.round(stats.bestRecentSession.totalVolume)} kg` : "N/A"}
          </span>
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="card">
          <Link href="/workout">
            <PrimaryButton>Demarrer une nouvelle seance</PrimaryButton>
          </Link>
        </section>
      )}

      <section className="history-timeline">
        {sessions.length === 0 ? (
          <section className="card history-empty">
            {historyVisual?.image && (
              <Image
                src={historyVisual.image}
                alt={historyVisual.title}
                className="history-empty-image"
                width={1200}
                height={500}
              />
            )}
            <p className="muted">Aucune seance pour l&apos;instant.</p>
            <Link href="/workout" className="outline-link mt-10">Demarrer une seance</Link>
          </section>
        ) : (
          sessions.map((session) => {
            const cover = session.sets[0]?.exercise?.fallbackThumbnailPath || session.sets[0]?.exercise?.fallbackImagePath || "";
            return (
              <Link key={session.id} href={`/history/${session.id}`} className="card history-item">
                {cover ? (
                  <Image src={cover} alt={session.title} className="history-item-image" width={1200} height={500} />
                ) : null}
                <p className="eyebrow">{formatDate(session.startedAt ?? session.createdAt)} · {session.status === "COMPLETED" ? "Terminee" : "Brouillon"}</p>
                <h2 className="section-title">{session.title}</h2>
                <div className="chips">
                  <span className="chip">Exercices: {session.exerciseCount}</span>
                  <span className="chip">Series: {session.setsCount}</span>
                  <span className="chip">Volume: {Math.round(session.totalVolume)} kg</span>
                  <span className="chip">Duree: {formatDuration(session.durationSeconds)}</span>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
