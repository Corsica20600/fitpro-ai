import { NextResponse } from "next/server";
import { AssistantAdminAccessError, requireTraknioAssistantAdmin } from "@/src/server/assistant/admin-access";
import { getAssistantUnansweredQuestions } from "@/src/server/assistant/admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireTraknioAssistantAdmin();
    const status = new URL(request.url).searchParams.get("status");
    const questions = await getAssistantUnansweredQuestions(status === "resolved" || status === "all" ? status : "open");
    return NextResponse.json({ questions }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    if (error instanceof AssistantAdminAccessError) {
      return NextResponse.json({ error: error.code.toLocaleLowerCase("fr-FR") }, { status: error.code === "AUTH_REQUIRED" ? 401 : 403 });
    }
    console.error("ASSISTANT_ADMIN: impossible de lire les questions", error);
    return NextResponse.json({ error: "admin_unavailable" }, { status: 503 });
  }
}
