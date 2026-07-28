import Link from "next/link";
import { MuscleDistribution } from "@/src/components/progress/muscle-distribution";
import { PersonalRecordCard } from "@/src/components/progress/personal-record-card";
import { ProgressChart } from "@/src/components/progress/progress-chart";
import { ProgressPeriodSelector } from "@/src/components/progress/progress-period-selector";
import { ProgressRings } from "@/src/components/progress/progress-rings";
import { EmptyState } from "@/src/components/ui/empty-state";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionTitle } from "@/src/components/ui/section-title";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";
import { getProgressDataForDemoUser } from "@/src/server/fitness-queries";

export const metadata = privatePageMetadata(
  "Progression",
  "Progression privée Traknio avec records, volumes, muscles et tendances.",
);

const PERIODS = [
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "3m", label: "3 mois" },
  { key: "1y", label: "1 an" },
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("fr-FR");
}

function formatKg(value: number) {
  return `${formatNumber(value)} kg`;
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatChange(value: number | null) {
  if (value == null) return null;
  if (Math.abs(value) < 1) return "Volume stable sur la période";
  return value > 0
    ? `Volume en hausse de ${value.toLocaleString("fr-FR")} %`
    : `Volume en baisse de ${Math.abs(value).toLocaleString("fr-FR")} %`;
}

function ringPercent(current: number, previous: number) {
  if (previous <= 0 && current > 0) return 100;
  if (previous <= 0) return 0;
  return Math.min(100, Math.round((current / previous) * 100));
}

export default async function ProgressPage(props: PageProps<"/progress">) {
  const searchParams = await props.searchParams;
  const requestedPeriod = firstParam(searchParams.period).trim();
  const data = await getProgressDataForDemoUser(requestedPeriod);
  const current = data.summary.current;
  const previous = data.summary.previous;
  const volumeMessage = formatChange(data.summary.changes.volumePercent) ?? "Pas encore assez de données pour comparer";

  const rings = [
    {
      label: "Séances",
      valueLabel: formatNumber(current.sessions),
      detail: previous.sessions > 0 ? `vs ${formatNumber(previous.sessions)} avant` : "Base actuelle",
      percent: ringPercent(current.sessions, previous.sessions),
      tone: "blue" as const,
      ariaLabel: `${current.sessions} séances sur ${data.period.label}`,
    },
    {
      label: "Volume",
      valueLabel: formatKg(current.volume),
      detail: previous.volume > 0 ? `vs ${formatKg(previous.volume)} avant` : "Volume enregistré",
      percent: ringPercent(current.volume, previous.volume),
      tone: "green" as const,
      ariaLabel: `${formatKg(current.volume)} de volume sur ${data.period.label}`,
    },
    {
      label: "Durée",
      valueLabel: formatDuration(current.durationSeconds),
      detail: previous.durationSeconds > 0 ? `vs ${formatDuration(previous.durationSeconds)} avant` : "Temps cumulé",
      percent: ringPercent(current.durationSeconds, previous.durationSeconds),
      tone: "gold" as const,
      ariaLabel: `${formatDuration(current.durationSeconds)} d'entraînement sur ${data.period.label}`,
    },
    {
      label: "Séries",
      valueLabel: formatNumber(current.sets),
      detail: previous.sets > 0 ? `vs ${formatNumber(previous.sets)} avant` : "Séries validées",
      percent: ringPercent(current.sets, previous.sets),
      tone: "violet" as const,
      ariaLabel: `${current.sets} séries validées sur ${data.period.label}`,
    },
  ];

  const records = [
    data.records.bestWeight ? {
      type: "Charge maximale",
      value: formatKg(data.records.bestWeight.value),
      context: data.records.bestWeight.exerciseName,
      date: formatDate(data.records.bestWeight.date),
      symbol: "PR",
    } : null,
    data.records.bestSession ? {
      type: "Meilleure séance",
      value: formatKg(data.records.bestSession.volume),
      context: data.records.bestSession.title,
      date: formatDate(data.records.bestSession.date),
      symbol: "MAX",
    } : null,
    data.records.longestSession ? {
      type: "Séance la plus longue",
      value: formatDuration(data.records.longestSession.durationSeconds),
      context: data.records.longestSession.title,
      date: formatDate(data.records.longestSession.date),
      symbol: "TIME",
    } : null,
    data.records.mostPracticedExercise ? {
      type: "Exercice le plus pratiqué",
      value: `${formatNumber(data.records.mostPracticedExercise.sets)} séries`,
      context: data.records.mostPracticedExercise.name,
      date: null,
      symbol: "TOP",
    } : null,
  ].filter(Boolean) as Array<{
    type: string;
    value: string;
    context: string;
    date: string | null;
    symbol: string;
  }>;

  return (
    <div className="stack progress-dashboard">
      <PageHeader
        eyebrow="Tes performances"
        title="Progression"
        description={`Suis l'évolution de ton volume, de ta régularité et de tes performances. Période active: ${data.period.label}.`}
      />

      <ProgressPeriodSelector activePeriod={data.period.key} periods={PERIODS} />

      <GlassCard elevated className="progress-summary-card">
        <p className="fit-section-title__eyebrow">Résumé principal</p>
        <h2>Ta progression</h2>
        <strong>{volumeMessage}</strong>
        <div className="progress-summary-grid">
          <span><b>{formatNumber(current.sessions)}</b> séances</span>
          <span><b>{formatKg(current.volume)}</b> volume</span>
          <span><b>{formatNumber(current.sets)}</b> séries</span>
          <span><b>{formatDuration(current.durationSeconds)}</b> durée</span>
        </div>
      </GlassCard>

      {data.hasData ? (
        <>
          <ProgressRings items={rings} />

          <ProgressChart
            title="Volume par période"
            description={`Découpage ${data.period.bucketKind === "day" ? "par jour" : data.period.bucketKind === "week" ? "par semaine" : "par mois"}. Les valeurs restent lisibles sans interaction.`}
            bars={data.series.map((item) => ({
              key: item.key,
              label: item.label,
              value: item.volume,
              sessions: item.sessions,
            }))}
            valueFormatter={formatKg}
            bestLabel={data.bestBucket && data.bestBucket.volume > 0 ? `${data.bestBucket.label} · ${formatKg(data.bestBucket.volume)}` : null}
          />

          {records.length > 0 ? (
            <section className="stack">
              <SectionTitle eyebrow="Records personnels" title="Tes meilleurs repères" />
              <div className="personal-record-grid">
                {records.map((record) => (
                  <PersonalRecordCard key={`${record.type}-${record.value}`} {...record} />
                ))}
              </div>
            </section>
          ) : null}

          <MuscleDistribution items={data.muscleDistribution} />

          <GlassCard className="progress-trends-card">
            <SectionTitle eyebrow="Régularité" title="Rythme d'entraînement" />
            <div className="progress-trend-grid">
              <span><b>{formatNumber(data.regularity.activeWeeks)}</b> semaines actives</span>
              <span><b>{data.regularity.averageSessionsPerWeek.toLocaleString("fr-FR")}</b> séances / semaine</span>
              <span><b>{formatNumber(data.regularity.bestStreakWeeks)}</b> meilleure série</span>
              <span><b>{data.regularity.favoriteDay?.label ?? "N/A"}</b> jour favori</span>
            </div>
            <p className="muted">
              {data.regularity.latestSessionAt
                ? `Dernière séance enregistrée le ${formatDate(data.regularity.latestSessionAt)}.`
                : "Aucune séance récente sur cette période."}
            </p>
          </GlassCard>
        </>
      ) : (
        <EmptyState
          title="Pas encore de données"
          description="Aucune séance terminée n'est enregistrée sur cette période. Lance une séance pour alimenter tes statistiques."
          action={<Link href="/workout" className="primary-button">Démarrer une séance</Link>}
        />
      )}
    </div>
  );
}
