"use client";

import { useMemo, useState } from "react";

import { ActionButtons } from "@/features/resume-analyzer/components/ActionButtons";
import { HeroCard } from "@/features/resume-analyzer/components/HeroCard";
import { InputSection } from "@/features/resume-analyzer/components/InputSection";
import { LiquidBackground } from "@/features/resume-analyzer/components/LiquidBackground";
import { ReportSection } from "@/features/resume-analyzer/components/ReportSection";
import styles from "@/features/resume-analyzer/styles.module.css";
import type { AnalysisReport, JobDescriptionProfile, ResumeProfile } from "@/lib/types";

type ApiError = { error: string };

const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const formatScoreBadge = (score: number): string => {
  if (score >= 80) return "Excellent match";
  if (score >= 60) return "Good base";
  if (score >= 40) return "Needs improvements";
  return "Low match";
};

export const ResumeAnalyzerPage = () => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [resume, setResume] = useState<ResumeProfile | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescriptionProfile | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = Boolean(resumeFile && jdText.trim().length > 30);
  const scoreLabel = useMemo(
    () => (report ? formatScoreBadge(report.score) : ""),
    [report],
  );

  const handleAnalyze = async () => {
    if (!resumeFile || !jdText.trim()) {
      setError("Upload a resume and paste a valid job description first.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const resumeResponse = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });
      const resumePayload = (await resumeResponse.json()) as
        | { resume: ResumeProfile }
        | ApiError;
      if (!resumeResponse.ok || !("resume" in resumePayload)) {
        throw new Error("error" in resumePayload ? resumePayload.error : "Resume parse failed.");
      }

      const jdResponse = await fetch("/api/jd/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: jdText }),
      });
      const jdPayload = (await jdResponse.json()) as
        | { jobDescription: JobDescriptionProfile }
        | ApiError;
      if (!jdResponse.ok || !("jobDescription" in jdPayload)) {
        throw new Error("error" in jdPayload ? jdPayload.error : "JD analysis failed.");
      }

      const scoreResponse = await fetch("/api/match/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resumePayload.resume,
          jobDescription: jdPayload.jobDescription,
        }),
      });
      const scorePayload = (await scoreResponse.json()) as
        | { report: AnalysisReport }
        | ApiError;
      if (!scoreResponse.ok || !("report" in scorePayload)) {
        throw new Error("error" in scorePayload ? scorePayload.error : "Score generation failed.");
      }

      setResume(resumePayload.resume);
      setJobDescription(jdPayload.jobDescription);
      setReport(scorePayload.report);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unexpected error happened.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!report) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
        }),
      });
      const payload = (await response.json()) as
        | { draft: string; report: AnalysisReport }
        | ApiError;
      if (!response.ok || !("report" in payload)) {
        throw new Error("error" in payload ? payload.error : "Cover letter generation failed.");
      }
      setReport(payload.report);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Failed to generate cover letter.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!report) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/report/${report.id}`);
      const payload = (await response.json()) as
        | { markdown: string; report: AnalysisReport }
        | ApiError;
      if (!response.ok || !("markdown" in payload)) {
        throw new Error("error" in payload ? payload.error : "Report export failed.");
      }
      downloadTextFile(`report-${report.id}.md`, payload.markdown);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Failed to export report.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LiquidBackground />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <HeroCard />
        <InputSection
          resumeFile={resumeFile}
          jdText={jdText}
          onFileChange={setResumeFile}
          onJdChange={setJdText}
        />
        <ActionButtons
          canAnalyze={canAnalyze}
          hasReport={Boolean(report)}
          loading={loading}
          onAnalyze={handleAnalyze}
          onGenerateCoverLetter={handleGenerateCoverLetter}
          onExportMarkdown={handleExportMarkdown}
        />

        {error ? (
          <p
            className={`${styles.glassSubtle} mt-4 rounded-xl border-red-200/40 px-4 py-3 text-sm text-rose-100`}
          >
            {error}
          </p>
        ) : null}

        {report ? (
          <ReportSection
            report={report}
            resume={resume}
            jobDescription={jobDescription}
            scoreLabel={scoreLabel}
          />
        ) : null}
      </main>
    </>
  );
};
