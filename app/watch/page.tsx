"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useState } from "react";

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

export default function WatchPage() {
  const [state, setState] = useState<WatchState | null>(null);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [displayRestRemaining, setDisplayRestRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    try {
      const response = await fetch("/api/watch/current-session", { cache: "no-store" });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.payload) {
        setState(null);
        setRestEndsAt(null);
        setDisplayRestRemaining(0);
        setError(data.error ?? "Aucune seance active.");
        return;
      }
      setState(data.payload);
      const nextRemaining = Math.max(0, Math.floor(data.payload.restRemaining ?? 0));
      if (nextRemaining > 0) {
        const restStartedAt = Date.now();
        const nextRestEndsAt = restStartedAt + nextRemaining * 1000;
        setRestEndsAt(nextRestEndsAt);
        setDisplayRestRemaining(Math.max(0, Math.ceil((nextRestEndsAt - Date.now()) / 1000)));
      } else {
        setRestEndsAt(null);
        setDisplayRestRemaining(0);
      }
      setError(null);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId: state.sessionId, ...body }),
        });
        const data = (await response.json()) as ApiResponse;
        if (!response.ok || !data.payload) {
          setError(data.error ?? "Action refusee.");
          return;
        }
        setState(data.payload);
        const nextRemaining = Math.max(0, Math.floor(data.payload.restRemaining ?? 0));
        if (nextRemaining > 0) {
          const restStartedAt = Date.now();
          const nextRestEndsAt = restStartedAt + nextRemaining * 1000;
          setRestEndsAt(nextRestEndsAt);
          setDisplayRestRemaining(Math.max(0, Math.ceil((nextRestEndsAt - Date.now()) / 1000)));
        } else {
          setRestEndsAt(null);
          setDisplayRestRemaining(0);
        }
        setError(null);
      } catch {
        setError("Erreur reseau.");
      } finally {
        setBusy(false);
      }
    },
    [busy, state],
  );

  const subtitle = useMemo(() => {
    if (!state) return "Demarre une seance sur FitAI.";
    const weightPart = state.weight == null ? "-" : `${state.weight} kg`;
    return `Exo ${state.exerciseIndex}/${state.totalExercises} · Serie ${state.setIndex}/${state.totalSets} · ${state.targetReps} reps · ${weightPart}`;
  }, [state]);

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>FitAI Watch</h1>
        {loading ? <p style={styles.text}>Chargement...</p> : null}
        {!loading ? <p style={styles.exercise}>{state?.exerciseName ?? "Aucune seance active"}</p> : null}
        <p style={styles.text}>{subtitle}</p>
        <p style={styles.rest}>Repos: {displayRestRemaining}s</p>
        {error ? <p style={styles.error}>{error}</p> : null}

        <div style={styles.grid}>
          <button style={styles.primary} disabled={!state || busy} onClick={() => void perform("/api/watch/validate-set", {
            actualReps: state?.targetReps ?? 10,
            weight: state?.weight ?? 0,
          })}>
            Valider serie
          </button>
          <button style={styles.secondary} disabled={!state || busy} onClick={() => void perform("/api/watch/skip-rest")}>
            Skip repos
          </button>
          <button style={styles.secondary} disabled={!state || busy} onClick={() => void perform("/api/watch/previous-exercise")}>
            Exo precedent
          </button>
          <button style={styles.secondary} disabled={!state || busy} onClick={() => void perform("/api/watch/next-exercise")}>
            Exo suivant
          </button>
          <button style={styles.danger} disabled={!state || busy} onClick={() => void perform("/api/watch/complete-session")}>
            Terminer
          </button>
          <button style={styles.secondary} disabled={busy} onClick={() => void refreshState()}>
            Actualiser
          </button>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "#020817",
    color: "#E2E8F0",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#0B1226",
    border: "1px solid #1E293B",
    borderRadius: "16px",
    padding: "16px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.2,
  },
  exercise: {
    margin: "12px 0 4px 0",
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  text: {
    margin: "8px 0",
    fontSize: "16px",
    color: "#CBD5E1",
  },
  rest: {
    margin: "4px 0 12px 0",
    fontSize: "20px",
    fontWeight: 700,
  },
  error: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    color: "#FCA5A5",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  primary: {
    gridColumn: "1 / -1",
    minHeight: "54px",
    borderRadius: "12px",
    border: "none",
    background: "#2563EB",
    color: "#FFFFFF",
    fontSize: "18px",
    fontWeight: 700,
  },
  secondary: {
    minHeight: "48px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
    fontSize: "16px",
    fontWeight: 600,
  },
  danger: {
    minHeight: "48px",
    borderRadius: "12px",
    border: "1px solid #7F1D1D",
    background: "#450A0A",
    color: "#FEE2E2",
    fontSize: "16px",
    fontWeight: 700,
  },
};
