import { NextResponse } from "next/server";
import { AssistantAdminAccessError, requireTraknioAssistantAdmin } from "@/src/server/assistant/admin-access";
import { createAssistantAdminArticle, getAssistantAdminArticles } from "@/src/server/assistant/admin-service";

export const dynamic = "force-dynamic";

function accessErrorResponse(error: unknown) {
  if (error instanceof AssistantAdminAccessError) {
    return NextResponse.json({ error: error.code.toLocaleLowerCase("fr-FR") }, { status: error.code === "AUTH_REQUIRED" ? 401 : 403 });
  }
  return null;
}

export async function GET(request: Request) {
  try {
    await requireTraknioAssistantAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sort = searchParams.get("sort");
    const data = await getAssistantAdminArticles({
      query: searchParams.get("query") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      status: status === "active" || status === "inactive" || status === "all" ? status : "all",
      sort: sort === "title" || sort === "category" || sort === "updatedAt" ? sort : "updatedAt",
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const response = accessErrorResponse(error);
    if (response) return response;
    console.error("ASSISTANT_ADMIN: impossible de lire les articles", error);
    return NextResponse.json({ error: "admin_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    await requireTraknioAssistantAdmin();
    const body = await request.json().catch(() => null);
    const result = await createAssistantAdminArticle(body);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ article: result.value }, { status: 201 });
  } catch (error) {
    const response = accessErrorResponse(error);
    if (response) return response;
    console.error("ASSISTANT_ADMIN: impossible de créer un article", error);
    return NextResponse.json({ error: "admin_unavailable" }, { status: 503 });
  }
}
