import { getAccountExportData } from "@/src/server/fitness-queries";

export async function GET() {
  try {
    const data = await getAccountExportData();
    const exportedAt = data.exportedAt.slice(0, 10);
    const filename = `fitai-pro-export-${exportedAt}.json`;

    return Response.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return Response.json({ error: "auth_required" }, { status: 401 });
    }

    throw error;
  }
}
