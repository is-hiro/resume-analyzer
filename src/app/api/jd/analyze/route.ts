import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeJobDescriptionText } from "@/lib/analysis-engine";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

const bodySchema = z.object({
  rawText: z.string().min(30),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const jobDescription = analyzeJobDescriptionText(body.rawText);
    return NextResponse.json({ jobDescription });
  } catch (error) {
    logError("JD analysis failed", { error: String(error) });
    return NextResponse.json(
      { error: "Invalid JD text or failed to analyze it." },
      { status: 400 },
    );
  }
}
