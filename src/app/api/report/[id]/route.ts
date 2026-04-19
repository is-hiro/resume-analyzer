import { NextResponse } from "next/server";

import { getReport } from "@/lib/report-store";
import { toMarkdownReport } from "@/lib/report-formatters";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = getReport(id);

  if (!payload) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const markdown = toMarkdownReport(
    payload.resume,
    payload.jobDescription,
    payload.report,
  );

  return NextResponse.json({
    report: payload.report,
    resume: payload.resume,
    jobDescription: payload.jobDescription,
    markdown,
  });
}
