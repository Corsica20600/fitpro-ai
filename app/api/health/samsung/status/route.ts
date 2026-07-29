import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: false,
    deprecated: true,
    message: "Samsung Health direct status is deprecated. Use Health Connect device pairing.",
  });
}
