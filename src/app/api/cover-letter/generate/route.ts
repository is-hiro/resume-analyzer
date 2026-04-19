import { NextResponse } from "next/server";
import { z } from "zod";

import { logError } from "@/lib/logger";
import { generateCoverLetterDraft } from "@/lib/report-formatters";
import { getReport, saveReport } from "@/lib/report-store";

export const runtime = "nodejs";

const requestSchema = z.object({
  reportId: z.string(),
});

export async function POST(request: Request) {
  try {
    const { reportId } = requestSchema.parse(await request.json());
    const payload = getReport(reportId);

    if (!payload) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const draft = await generateCoverLetterDraft(
      payload.resume,
      payload.jobDescription,
      payload.report,
    );

    const updatedReport = {
      ...payload.report,
      coverLetterDraft: draft,
    };

    saveReport({
      ...payload,
      report: updatedReport,
    });

    return NextResponse.json({ draft, report: updatedReport });
  } catch (error) {
    logError("Cover letter generation failed", { error: String(error) });
    return NextResponse.json(
      { error: "Could not generate cover letter draft." },
      { status: 400 },
    );
  }
}
