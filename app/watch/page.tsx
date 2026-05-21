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
    return `Exo ${state.exerciseIndex}/${state.totalExercises} · Série ${state.setIndex}/${state.totalSets}`;
  }, [state]);

  const detailLine = useMemo(() => {
    if (!state) return "";
    const weightPart = state.weight == null ? "-" : `${state.weight} kg`;
    return `${state.targetReps} reps · ${weightPart}`;
  }, [state]);

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.brand}>FITAI PRO</p>
        {loading ? <p style={styles.text}>Chargement...</p> : null}
        {!loading ? <p style={styles.exercise} title={state?.exerciseName ?? "Aucune séance active"}>{state?.exerciseName ?? "Aucune séance active"}</p> : null}
        <p style={styles.text}>{subtitle}</p>
        {state ? <p style={styles.detail}>{detailLine}</p> : null}
        <div style={styles.statusWrap}>
          <p style={styles.statusLabel}>{displayRestRemaining > 0 ? "RÉCUPÉRATION" : "PRÊT"}</p>
          <p style={styles.rest}>{displayRestRemaining > 0 ? `${displayRestRemaining}s` : "GO"}</p>
        </div>
        {error ? <p style={styles.error}>{error}</p> : null}

        <div style={styles.grid}>
          <button style={styles.primary} disabled={!state || busy} onClick={() => void perform("/api/watch/validate-set", {
            actualReps: state?.targetReps ?? 10,
            weight: state?.weight ?? 0,
          })}>
            Valider série
          </button>
          <button style={styles.secondary} disabled={!state || busy} onClick={() => void perform("/api/watch/skip-rest")}>
            Passer repos
          </button>
          <button style={styles.secondary} disabled={!state || busy} onClick={() => void perform("/api/watch/previous-exercise")}>
            Préc.
          </button>
          <button style={styles.secondary} disabled={!state || busy} onClick={() => void perform("/api/watch/next-exercise")}>
            Suiv.
          </button>
          <button style={styles.danger} disabled={!state || busy} onClick={() => void perform("/api/watch/complete-session")}>
            Fin
          </button>
          <button style={styles.secondary} disabled={busy} onClick={() => void refreshState()}>
            Sync
          </button>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "radial-gradient(circle at 50% 18%, #14316f 0%, #06112a 52%, #020617 100%)",
    color: "#E2E8F0",
    padding: "max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "314px",
    background: "linear-gradient(165deg, rgba(14,36,84,.97) 0%, rgba(10,20,48,.97) 38%, rgba(5,12,30,.98) 100%)",
    border: "1px solid rgba(148,163,184,.24)",
    borderRadius: "28px",
    padding: "14px 12px",
    boxShadow: "0 18px 38px rgba(1,8,22,.6), inset 0 1px 0 rgba(191,219,254,.22)",
  },
  brand: {
    margin: "0 0 2px 0",
    fontSize: "12px",
    letterSpacing: ".16em",
    fontWeight: 800,
    color: "#BFDBFE",
    lineHeight: 1.2,
    textAlign: "center",
  },
  exercise: {
    margin: "6px 0 3px 0",
    fontSize: "clamp(20px, 6.2vw, 28px)",
    fontWeight: 800,
    lineHeight: 1.08,
    textAlign: "center",
    textWrap: "pretty",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    minHeight: "2.2em",
  },
  text: {
    margin: "2px 0 0",
    fontSize: "13px",
    color: "#D6E6FF",
    fontWeight: 700,
    textAlign: "center",
  },
  detail: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#93C5FD",
    textAlign: "center",
  },
  statusWrap: {
    marginTop: "9px",
    padding: "10px 10px 8px",
    borderRadius: "18px",
    border: "1px solid rgba(147,197,253,.24)",
    background: "linear-gradient(180deg, rgba(15,30,64,.85) 0%, rgba(10,20,44,.88) 100%)",
    boxShadow: "inset 0 1px 0 rgba(219,234,254,.22)",
  },
  statusLabel: {
    margin: 0,
    fontSize: "10px",
    letterSpacing: ".15em",
    fontWeight: 800,
    color: "#BFDBFE",
    textAlign: "center",
  },
  rest: {
    margin: "4px 0 0 0",
    fontSize: "clamp(24px, 8vw, 34px)",
    fontWeight: 900,
    textAlign: "center",
    letterSpacing: ".02em",
    color: "#86EFAC",
    textShadow: "0 0 14px rgba(56,189,248,.35)",
  },
  error: {
    margin: "8px 0 8px 0",
    fontSize: "12px",
    color: "#FCA5A5",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
  },
  primary: {
    gridColumn: "1 / -1",
    minHeight: "46px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(180deg, #7DD3FC 0%, #3B82F6 52%, #1D4ED8 100%)",
    color: "#FFFFFF",
    fontSize: "17px",
    fontWeight: 800,
    boxShadow: "0 8px 16px rgba(37,99,235,.35), inset 0 1px 0 rgba(255,255,255,.28)",
  },
  secondary: {
    minHeight: "38px",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,.35)",
    background: "linear-gradient(180deg, rgba(15,25,52,.9) 0%, rgba(10,18,36,.9) 100%)",
    color: "#E5EDFF",
    fontSize: "14px",
    fontWeight: 700,
  },
  danger: {
    minHeight: "38px",
    borderRadius: "999px",
    border: "1px solid rgba(185,28,28,.65)",
    background: "linear-gradient(180deg, #7F1D1D 0%, #450A0A 100%)",
    color: "#FEE2E2",
    fontSize: "14px",
    fontWeight: 700,
  },
};
