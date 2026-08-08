import { NextResponse } from "next/server";
import { AssistantAdminAccessError, requireTraknioAssistantAdmin } from "@/src/server/assistant/admin-access";
import { updateAssistantUnansweredQuestion } from "@/src/server/assistant/admin-service";
import { parseResolvedInput } from "@/src/server/assistant/admin-validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireTraknioAssistantAdmin();
    const resolved = parseResolvedInput(await request.json().catch(() => null));
    if (resolved === null) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    const { id } = await context.params;
    const updated = await updateAssistantUnansweredQuestion(id, resolved);
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, resolved });
  } catch (error) {
    if (error instanceof AssistantAdminAccessError) {
      return NextResponse.json({ error: error.code.toLocaleLowerCase("fr-FR") }, { status: error.code === "AUTH_REQUIRED" ? 401 : 403 });
    }
    console.error("ASSISTANT_ADMIN: impossible de mettre à jour une question", error);
    return NextResponse.json({ error: "admin_unavailable" }, { status: 503 });
  }
}
