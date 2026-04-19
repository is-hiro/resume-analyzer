import { NextResponse } from "next/server";

import { getGigachatModels } from "@/lib/llm";

export const runtime = "nodejs";

export async function GET() {
  const models = await getGigachatModels();

  if (!models) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Failed to fetch models from configured provider. Check credentials, base URL, and TLS trust chain.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    modelsCount: models.length,
    models: models.map((model) => ({
      id: model.id,
      ownedBy: model.owned_by ?? "unknown",
    })),
  });
}
