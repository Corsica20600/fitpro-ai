export type WatchRestDeadline = {
  endsAtEpochMs: number;
  receivedAtEpochMs: number;
  receivedAtPerfMs: number;
};

export function formatWatchRest(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  if (safeSeconds <= 0) return "GO";
  if (safeSeconds < 60) return String(safeSeconds);

  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function getRemainingFromDeadline(deadline: WatchRestDeadline | null, perfNowMs: number) {
  if (!deadline) return 0;

  const elapsedMs = Math.max(0, perfNowMs - deadline.receivedAtPerfMs);
  const remainingMs = deadline.endsAtEpochMs - deadline.receivedAtEpochMs - elapsedMs;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function createRestDeadlineFromServer(input: {
  restRemaining: number;
  receivedAtEpochMs: number;
  receivedAtPerfMs: number;
}) {
  const remainingSeconds = Math.max(0, Math.floor(input.restRemaining));
  if (remainingSeconds <= 0) return null;

  return {
    endsAtEpochMs: input.receivedAtEpochMs + remainingSeconds * 1000,
    receivedAtEpochMs: input.receivedAtEpochMs,
    receivedAtPerfMs: input.receivedAtPerfMs,
  };
}

export function shouldReplaceRestDeadline(input: {
  current: WatchRestDeadline | null;
  next: WatchRestDeadline | null;
  perfNowMs: number;
  contextChanged: boolean;
  toleranceSeconds?: number;
}) {
  if (input.contextChanged) return true;
  if (!input.current || !input.next) return input.current !== input.next;

  const toleranceSeconds = input.toleranceSeconds ?? 1.25;
  const currentRemaining = getRemainingFromDeadline(input.current, input.perfNowMs);
  const nextRemaining = getRemainingFromDeadline(input.next, input.next.receivedAtPerfMs);
  return Math.abs(currentRemaining - nextRemaining) > toleranceSeconds;
}
