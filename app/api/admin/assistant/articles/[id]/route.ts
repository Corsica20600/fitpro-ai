import { NextResponse } from "next/server";
import { AssistantAdminAccessError, requireTraknioAssistantAdmin } from "@/src/server/assistant/admin-access";
import { updateAssistantAdminArticle } from "@/src/server/assistant/admin-service";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireTraknioAssistantAdmin();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const result = await updateAssistantAdminArticle(id, body);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "not_found" ? 404 : 400 });
    return NextResponse.json({ article: result.value });
  } catch (error) {
    if (error instanceof AssistantAdminAccessError) {
      return NextResponse.json({ error: error.code.toLocaleLowerCase("fr-FR") }, { status: error.code === "AUTH_REQUIRED" ? 401 : 403 });
    }
    console.error("ASSISTANT_ADMIN: impossible de modifier un article", error);
    return NextResponse.json({ error: "admin_unavailable" }, { status: 503 });
  }
}
