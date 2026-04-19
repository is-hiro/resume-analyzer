import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { resumeParseSchema } from "@/lib/schemas";
import { extractBulletPoints, extractSectionLines, extractSkillsFromText, splitLines, uniq } from "@/lib/text-utils";
import type { ResumeProfile } from "@/lib/types";

const EXPERIENCE_PATTERNS = [/\b\d{4}\s*[-–]\s*(?:\d{4}|present|now)\b/i, /\b(intern|developer|engineer|manager|lead)\b/i];
const EDUCATION_PATTERN = /\b(bachelor|master|phd|university|college|bootcamp|faculty)\b/i;

const randomId = () => crypto.randomUUID();
const require = createRequire(import.meta.url);
let workerConfigured = false;

const ensurePdfWorkerConfigured = (): void => {
  if (workerConfigured) {
    return;
  }
  let resolvedWorkerPath = "";
  try {
    resolvedWorkerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  } catch {
    resolvedWorkerPath = "";
  }
  const fallbackWorkerPath = join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs",
  );
  const resolvedPathExists = Boolean(
    resolvedWorkerPath && existsSync(resolvedWorkerPath),
  );
  const fallbackPathExists = existsSync(fallbackWorkerPath);
  const selectedWorkerPath = resolvedPathExists
    ? resolvedWorkerPath
    : fallbackWorkerPath;
  const selectedWorkerUrl = pathToFileURL(selectedWorkerPath).href;
  PDFParse.setWorker(selectedWorkerUrl);
  workerConfigured = true;
  // #region agent log
  fetch("http://127.0.0.1:7285/ingest/4eb829dd-1e32-499a-8314-4d0cb37249dc", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "965696" },
    body: JSON.stringify({
      sessionId: "965696",
      runId: "post-fix",
      hypothesisId: "H8",
      location: "src/lib/resume-parser.ts:37",
      message: "worker path resolution diagnostics",
      data: {
        resolvedPathExists,
        fallbackPathExists,
        selectedFrom: resolvedPathExists ? "require.resolve" : "cwd-fallback",
        selectedPathHasProjectToken: selectedWorkerPath.includes("[project]"),
        selectedWorkerUrlHasFileScheme: selectedWorkerUrl.startsWith("file://"),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

export const extractTextFromResumeFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  // #region agent log
  fetch("http://127.0.0.1:7285/ingest/4eb829dd-1e32-499a-8314-4d0cb37249dc", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "965696" },
    body: JSON.stringify({
      sessionId: "965696",
      runId: "initial-debug",
      hypothesisId: "H1",
      location: "src/lib/resume-parser.ts:17",
      message: "resume file metadata",
      data: { fileName, fileType, byteLength: buffer.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (fileType.includes("pdf") || fileName.endsWith(".pdf")) {
    try {
      // #region agent log
      fetch("http://127.0.0.1:7285/ingest/4eb829dd-1e32-499a-8314-4d0cb37249dc", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "965696" },
        body: JSON.stringify({
          sessionId: "965696",
          runId: "initial-debug",
          hypothesisId: "H2",
          location: "src/lib/resume-parser.ts:32",
          message: "entering pdf parsing branch",
          data: { isPdfByType: fileType.includes("pdf"), isPdfByName: fileName.endsWith(".pdf") },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      ensurePdfWorkerConfigured();
      // #region agent log
      fetch("http://127.0.0.1:7285/ingest/4eb829dd-1e32-499a-8314-4d0cb37249dc", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "965696" },
        body: JSON.stringify({
          sessionId: "965696",
          runId: "post-fix",
          hypothesisId: "H7",
          location: "src/lib/resume-parser.ts:64",
          message: "pdf worker configured via resolved path",
          data: {
            workerConfigured,
            cwdWorkerPathExists: existsSync(
              join(
                process.cwd(),
                "node_modules",
                "pdfjs-dist",
                "legacy",
                "build",
                "pdf.worker.mjs",
              ),
            ),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      const parser = new PDFParse({ data: buffer });
      // #region agent log
      fetch("http://127.0.0.1:7285/ingest/4eb829dd-1e32-499a-8314-4d0cb37249dc", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "965696" },
        body: JSON.stringify({
          sessionId: "965696",
          runId: "initial-debug",
          hypothesisId: "H3",
          location: "src/lib/resume-parser.ts:47",
          message: "pdf parser constructed",
          data: { parserConstructed: true },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      const result = await parser.getText();
      // #region agent log
      fetch("http://127.0.0.1:7285/ingest/4eb829dd-1e32-499a-8314-4d0cb37249dc", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "965696" },
        body: JSON.stringify({
          sessionId: "965696",
          runId: "initial-debug",
          hypothesisId: "H4",
          location: "src/lib/resume-parser.ts:62",
          message: "pdf getText completed",
          data: { textLength: result.text?.length ?? 0 },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      await parser.destroy();
      return result.text ?? "";
    } catch (error) {
      // #region agent log
      fetch("http://127.0.0.1:7285/ingest/4eb829dd-1e32-499a-8314-4d0cb37249dc", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "965696" },
        body: JSON.stringify({
          sessionId: "965696",
          runId: "initial-debug",
          hypothesisId: "H2",
          location: "src/lib/resume-parser.ts:77",
          message: "pdf parsing branch failed",
          data: {
            errorName: error instanceof Error ? error.name : "unknown",
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      throw error;
    }
  }

  if (
    fileType.includes("wordprocessingml") ||
    fileType.includes("msword") ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }

  return buffer.toString("utf8");
};

export const parseResumeText = (rawText: string): ResumeProfile => {
  const lines = splitLines(rawText);
  const skillSection = extractSectionLines(rawText, ["skills", "tech stack", "technologies"]);
  const experienceSection = extractSectionLines(rawText, ["experience", "work experience", "employment"]);
  const educationSection = extractSectionLines(rawText, ["education"]);

  const parsedSkills = uniq([...extractSkillsFromText(rawText), ...extractSkillsFromText(skillSection.join("\n"))]);
  const parsedExperience = uniq(
    [...experienceSection, ...lines.filter((line) => EXPERIENCE_PATTERNS.some((pattern) => pattern.test(line)))].slice(0, 12),
  );
  const parsedEducation = uniq(
    [...educationSection, ...lines.filter((line) => EDUCATION_PATTERN.test(line))].slice(0, 8),
  );
  const bulletPoints = extractBulletPoints(rawText).slice(0, 12);

  const validated = resumeParseSchema.parse({
    parsedSkills,
    parsedExperience,
    parsedEducation,
    bulletPoints,
  });

  return {
    id: randomId(),
    rawText,
    parsedSkills: validated.parsedSkills,
    parsedExperience: validated.parsedExperience,
    parsedEducation: validated.parsedEducation,
    bulletPoints: validated.bulletPoints,
    createdAt: new Date().toISOString(),
  };
};
