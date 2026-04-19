import { NextResponse } from "next/server";

import { logError } from "@/lib/logger";
import { extractTextFromResumeFile, parseResumeText } from "@/lib/resume-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
    }

    const rawText = await extractTextFromResumeFile(file);
    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from resume. Try another file." },
        { status: 422 },
      );
    }

    const resume = parseResumeText(rawText);
    return NextResponse.json({ resume });
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7285/ingest/4eb829dd-1e32-499a-8314-4d0cb37249dc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "965696" },
      body: JSON.stringify({
        sessionId: "965696",
        runId: "initial-debug",
        hypothesisId: "H5",
        location: "src/app/api/resume/parse/route.ts:29",
        message: "resume parse api catch",
        data: {
          errorName: error instanceof Error ? error.name : "unknown",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    logError("Resume parsing failed", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to parse resume. Please try again." },
      { status: 500 },
    );
  }
}
