"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WatchMetricCard } from "@/src/components/watch/watch-metric-card";
import { WatchPermissionsCard } from "@/src/components/watch/watch-permissions-card";
import { WatchStatusCard } from "@/src/components/watch/watch-status-card";
import { WatchSyncCard } from "@/src/components/watch/watch-sync-card";

type WatchState = {
  sessionId: string;
  exerciseName: string;
  exerciseIndex: number;
  totalExercises: number;
  setIndex: number;
  totalSets: number;
  targetReps: number;
  weight: number | null;
  restRemaining: number;
  status: string;
};

type ApiResponse = {
  payload?: WatchState;
  error?: string;
};

function formatRest(seconds: number) {
  if (seconds <= 0) return "GO";
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatTime(date: Date | null) {
  if (!date) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export default function WatchPage() {
  const [state, setState] = useState<WatchState | null>(null);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [displayRestRemaining, setDisplayRestRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAttemptAt, setLastAttemptAt] = useState<Date | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<Date | null>(null);

  const applyPayload = useCallback((payload: WatchState) => {
    setState(payload);
    const nextRemaining = Math.max(0, Math.floor(payload.restRemaining ?? 0));
    if (nextRemaining > 0) {
      const nextRestEndsAt = Date.now() + nextRemaining * 1000;
      setRestEndsAt(nextRestEndsAt);
      setDisplayRestRemaining(Math.max(0, Math.ceil((nextRestEndsAt - Date.now()) / 1000)));
    } else {
      setRestEndsAt(null);
      setDisplayRestRemaining(0);
    }
    setError(null);
    setLastSuccessAt(new Date());
  }, []);

  const refreshState = useCallback(async () => {
    setLastAttemptAt(new Date());
    try {
      const response = await fetch("/api/watch/current-session", { cache: "no-store" });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.payload) {
        setState(null);
        setRestEndsAt(null);
        setDisplayRestRemaining(0);
        setError(data.error ?? "Aucune séance active.");
        return;
      }
      applyPayload(data.payload);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    const bootId = window.setTimeout(() => {
      void refreshState();
    }, 0);
    const id = window.setInterval(() => {
      void refreshState();
    }, 2000);
    return () => {
      window.clearTimeout(bootId);
      window.clearInterval(id);
    };
  }, [refreshState]);

  useEffect(() => {
    if (restEndsAt == null) return;
    const refresh = () => {
      const remainingSeconds = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setDisplayRestRemaining(remainingSeconds);
      if (remainingSeconds <= 0) {
        setRestEndsAt(null);
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 250);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [restEndsAt]);

  const perform = useCallback(
    async (path: string, body?: Record<string, unknown>) => {
      if (!state || busy) return;
      setBusy(true);
      setLastAttemptAt(new Date());
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: state.sessionId, ...body }),
        });
        const data = (await response.json()) as ApiResponse;
        if (!response.ok || !data.payload) {
          setError(data.error ?? "Action refusée.");
          return;
        }
        applyPayload(data.payload);
      } catch {
        setError("Erreur reseau.");
      } finally {
        setBusy(false);
      }
    },
    [applyPayload, busy, state],
  );

  const subtitle = useMemo(() => {
    if (!state) return "Démarre une séance sur FitAI Pro pour alimenter la montre.";
    return `Exercice ${state.exerciseIndex}/${state.totalExercises} · Série ${state.setIndex}/${state.totalSets}`;
  }, [state]);

  const metrics = [
    { label: "Exercice", value: state?.exerciseName ?? "Indisponible", detail: state ? "Séance active" : "Aucune donnée" },
    { label: "Progression", value: state ? `${state.exerciseIndex}/${state.totalExercises}` : "-", detail: "Exercices" },
    { label: "Série", value: state ? `${state.setIndex}/${state.totalSets}` : "-", detail: "Position actuelle" },
    { label: "Cible", value: state ? String(state.targetReps) : "-", unit: " reps", detail: "Répétitions" },
    { label: "Charge", value: state?.weight == null ? "-" : String(state.weight), unit: state?.weight == null ? undefined : " kg", detail: "Dernière charge connue" },
    { label: "Repos", value: formatRest(displayRestRemaining), detail: displayRestRemaining > 0 ? "Récupération" : "Prêt" },
  ];

  return (
    <main className="watch-page-v2">
      <div className="watch-shell-v2">
        <WatchStatusCard loading={loading} hasState={Boolean(state)} error={error} subtitle={subtitle} />

        <section className="watch-last-sync-card">
          <p className="eyebrow">Dernière synchronisation</p>
          <h2>{formatTime(lastSuccessAt)}</h2>
          <p>Dernière tentative: {formatTime(lastAttemptAt)}</p>
        </section>

        <section className="watch-metric-grid" aria-label="Métriques montre disponibles">
          {metrics.map((metric) => (
            <WatchMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              detail={metric.detail}
              unavailable={!state}
            />
          ))}
        </section>

        <WatchPermissionsCard
          items={[
            {
              label: "Séance FitAI",
              state: state ? "Disponible" : "En attente",
              detail: "La montre lit la séance active via les endpoints watch existants.",
              tone: state ? "success" : "warning",
            },
            {
              label: "Samsung Health",
              state: "Non exposé ici",
              detail: "Aucune métrique Samsung Health n'est affichée par cette page actuellement.",
              tone: "neutral",
            },
          ]}
        />

        <WatchSyncCard
          busy={busy || loading}
          disabled={false}
          lastAttemptLabel={formatTime(lastAttemptAt)}
          metricsCount={state ? metrics.length : 0}
          onRefresh={() => void refreshState()}
        />

        <section className="watch-action-grid" aria-label="Actions montre">
          <button className="primary-button" disabled={!state || busy} onClick={() => void perform("/api/watch/validate-set", {
            actualReps: state?.targetReps ?? 10,
            weight: state?.weight ?? null,
          })}>
            Valider série
          </button>
          <button className="ghost-btn" disabled={!state || busy} onClick={() => void perform("/api/watch/skip-rest")}>
            Passer repos
          </button>
          <button className="ghost-btn" disabled={!state || busy} onClick={() => void perform("/api/watch/previous-exercise")}>
            Précédent
          </button>
          <button className="ghost-btn" disabled={!state || busy} onClick={() => void perform("/api/watch/next-exercise")}>
            Suivant
          </button>
          <button className="ghost-btn chip danger" disabled={!state || busy} onClick={() => void perform("/api/watch/complete-session")}>
            Fin
          </button>
        </section>

        {error ? (
          <section className="watch-error-card">
            <p className="eyebrow">Fallback</p>
            <h2>Action requise</h2>
            <p>{error}</p>
          </section>
        ) : null}

        <details className="watch-tech-card">
          <summary>Informations techniques</summary>
          <p>Polling conservé: `/api/watch/current-session` toutes les 2 secondes.</p>
          <p>Session: {state?.sessionId ?? "aucune"}</p>
          <p>Statut brut: {state?.status ?? "indisponible"}</p>
        </details>
      </div>
    </main>
  );
}
