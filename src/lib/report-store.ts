import type { AnalysisReport, JobDescriptionProfile, ResumeProfile } from "@/lib/types";

type StoredReport = {
  report: AnalysisReport;
  resume: ResumeProfile;
  jobDescription: JobDescriptionProfile;
};

const reports = new Map<string, StoredReport>();

export const saveReport = (payload: StoredReport): void => {
  reports.set(payload.report.id, payload);
};

export const getReport = (id: string): StoredReport | null => reports.get(id) ?? null;
