import { NextResponse } from "next/server";
import { z } from "zod";

import { generateScoreReport } from "@/lib/analysis-engine";
import { logError } from "@/lib/logger";
import { enhanceReportWithLlm } from "@/lib/report-formatters";
import { saveReport } from "@/lib/report-store";

export const runtime = "nodejs";

const requestSchema = z.object({
  resume: z.object({
    id: z.string(),
    rawText: z.string(),
    parsedSkills: z.array(z.string()),
    parsedExperience: z.array(z.string()),
    parsedEducation: z.array(z.string()),
    bulletPoints: z.array(z.string()),
    createdAt: z.string(),
  }),
  jobDescription: z.object({
    id: z.string(),
    rawText: z.string(),
    extractedRequirements: z.array(z.string()),
    extractedSkills: z.array(z.string()),
    extractedResponsibilities: z.array(z.string()),
  }),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const baseReport = generateScoreReport(body.resume, body.jobDescription);
    const report = await enhanceReportWithLlm(baseReport, body.resume, body.jobDescription);

    saveReport({
      report,
      resume: body.resume,
      jobDescription: body.jobDescription,
    });

    return NextResponse.json({ report });
  } catch (error) {
    logError("Score generation failed", { error: String(error) });
    return NextResponse.json(
      { error: "Could not build analysis report. Please retry." },
      { status: 400 },
    );
  }
}
