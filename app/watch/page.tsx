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
        setError(data.error ?? "Aucune séance active.");
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
          setError(data.error ?? "Action refusée.");
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
    if (!state) return "Démarre une séance sur FitAI.";
    const weightPart = state.weight == null ? "-" : `${state.weight} kg`;
    return `Exo ${state.exerciseIndex}/${state.totalExercises} · Série ${state.setIndex}/${state.totalSets} · ${state.targetReps} reps · ${weightPart}`;
  }, [state]);

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>FitAI Watch</h1>
        {loading ? <p style={styles.text}>Chargement...</p> : null}
        {!loading ? <p style={styles.exercise}>{state?.exerciseName ?? "Aucune séance active"}</p> : null}
        <p style={styles.text}>{subtitle}</p>
        <p style={styles.rest}>Repos : {displayRestRemaining}s</p>
        {error ? <p style={styles.error}>{error}</p> : null}

        <div style={styles.grid}>
          <button style={styles.primary} disabled={!state || busy} onClick={() => void perform("/api/watch/validate-set", {
            actualReps: state?.targetReps ?? 10,
            weight: state?.weight ?? 0,
          })}>
            Valider série
          </button>
          <button style={styles.secondary} disabled={!state || busy} onClick={() => void perform("/api/watch/skip-rest")}>
            Skip repos
          </button>
          <button style={styles.secondary} disabled={!state || busy} onClick={() => void perform("/api/watch/previous-exercise")}>
            Exo précédent
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
    padding: "max(14px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#0B1226",
    border: "1px solid #1E293B",
    borderRadius: "20px",
    padding: "clamp(14px, 2.6vw, 18px)",
    boxShadow: "0 14px 30px rgba(0,0,0,.45), inset 0 1px 0 rgba(120,168,255,.12)",
  },
  title: {
    margin: 0,
    fontSize: "clamp(20px, 4.6vw, 24px)",
    lineHeight: 1.2,
    textAlign: "center",
  },
  exercise: {
    margin: "12px 0 4px 0",
    fontSize: "clamp(18px, 4.8vw, 22px)",
    fontWeight: 700,
    lineHeight: 1.2,
    textAlign: "center",
    textWrap: "balance",
  },
  text: {
    margin: "8px 0",
    fontSize: "clamp(14px, 3.8vw, 16px)",
    color: "#CBD5E1",
    textAlign: "center",
    textWrap: "balance",
  },
  rest: {
    margin: "4px 0 12px 0",
    fontSize: "clamp(18px, 5vw, 22px)",
    fontWeight: 700,
    textAlign: "center",
  },
  error: {
    margin: "0 0 12px 0",
    fontSize: "clamp(12px, 3.4vw, 14px)",
    color: "#FCA5A5",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  primary: {
    gridColumn: "1 / -1",
    minHeight: "50px",
    borderRadius: "12px",
    border: "none",
    background: "#2563EB",
    color: "#FFFFFF",
    fontSize: "clamp(15px, 3.8vw, 17px)",
    fontWeight: 700,
  },
  secondary: {
    minHeight: "44px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
    fontSize: "clamp(13px, 3.4vw, 15px)",
    fontWeight: 600,
  },
  danger: {
    minHeight: "44px",
    borderRadius: "12px",
    border: "1px solid #7F1D1D",
    background: "#450A0A",
    color: "#FEE2E2",
    fontSize: "clamp(13px, 3.4vw, 15px)",
    fontWeight: 700,
  },
};
