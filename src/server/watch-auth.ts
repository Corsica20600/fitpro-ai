import { NextResponse } from "next/server";
import { auth } from "@/auth";

type WatchAccessResult =
  | { ok: true; mode: "session" | "token" | "legacy" }
  | { ok: false; response: NextResponse };

function getExpectedWatchToken() {
  return process.env.FITAI_WATCH_TOKEN?.trim() || "";
}

function safeTokenEquals(actual: string, expected: string) {
  return actual.length > 0 && expected.length > 0 && actual === expected;
}

export async function requireWatchAccess(request: Request): Promise<WatchAccessResult> {
  const session = await auth().catch(() => null);
  if (session?.user?.email) {
    return { ok: true, mode: "session" };
  }

  const expectedToken = getExpectedWatchToken();
  if (!expectedToken) {
    // Compatibility mode: the current installed watch app has no token yet.
    return { ok: true, mode: "legacy" };
  }

  const providedToken = request.headers.get("x-watch-token")?.trim() || "";
  if (safeTokenEquals(providedToken, expectedToken)) {
    return { ok: true, mode: "token" };
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "watch_pairing_required" },
      { status: 401 },
    ),
  };
}
