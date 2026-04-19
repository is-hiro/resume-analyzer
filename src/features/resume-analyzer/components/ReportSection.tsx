import styles from "@/features/resume-analyzer/styles.module.css";
import type { AnalysisReport, JobDescriptionProfile, ResumeProfile } from "@/lib/types";

type ReportSectionProps = {
  report: AnalysisReport;
  resume: ResumeProfile | null;
  jobDescription: JobDescriptionProfile | null;
  scoreLabel: string;
};

export const ReportSection = ({
  report,
  resume,
  jobDescription,
  scoreLabel,
}: ReportSectionProps) => (
  <section className="mt-8 space-y-6">
    <div className={`${styles.glassCard} rounded-3xl p-6`}>
      <h2 className="text-xl font-semibold text-white">Analysis Report</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className={`${styles.glassSubtle} rounded-2xl p-4`}>
          <p className="text-xs uppercase tracking-wide text-blue-100/70">Match Score</p>
          <p className="mt-1 text-3xl font-bold text-white">{report.score}/100</p>
          <p className="mt-1 text-xs text-cyan-100">{scoreLabel}</p>
        </div>
        <div className={`${styles.glassSubtle} rounded-2xl p-4`}>
          <p className="text-xs uppercase tracking-wide text-blue-100/70">Skills in Resume</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {resume?.parsedSkills.length ?? 0}
          </p>
        </div>
        <div className={`${styles.glassSubtle} rounded-2xl p-4`}>
          <p className="text-xs uppercase tracking-wide text-blue-100/70">JD Requirements</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {jobDescription?.extractedRequirements.length ?? 0}
          </p>
        </div>
      </div>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <div className={`${styles.glassCard} rounded-3xl p-6`}>
        <h3 className="text-lg font-semibold text-white">Strong Matches</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-100/85">
          {report.matches.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
      <div className={`${styles.glassCard} rounded-3xl p-6`}>
        <h3 className="text-lg font-semibold text-white">Missing Skills / Gaps</h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-100/85">
          {report.gaps.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    </div>

    <div className={`${styles.glassCard} rounded-3xl p-6`}>
      <h3 className="text-lg font-semibold text-white">Actionable Recommendations</h3>
      <ul className="mt-3 space-y-2 text-sm text-blue-100/85">
        {report.suggestions.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>

    {report.coverLetterDraft ? (
      <div className={`${styles.glassCard} rounded-3xl p-6`}>
        <h3 className="text-lg font-semibold text-white">Cover Letter Draft</h3>
        <pre className={`${styles.liquidInput} mt-4 whitespace-pre-wrap rounded-xl p-4 text-sm text-blue-50`}>
          {report.coverLetterDraft}
        </pre>
      </div>
    ) : null}
  </section>
);
