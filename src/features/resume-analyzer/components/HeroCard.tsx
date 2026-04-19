import styles from "@/features/resume-analyzer/styles.module.css";

export const HeroCard = () => (
  <div className={`${styles.glassCard} ${styles.pulseGlow} rounded-3xl p-6 md:p-8`}>
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
          AI Resume Analyzer
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-blue-50/80">
          Upload your resume, paste a job description, and get a transparent score, gaps,
          actionable recommendations, and a cover letter draft.
        </p>
      </div>
      <a
        href="https://github.com/is-hiro"
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.glassSubtle} inline-flex items-center self-start rounded-xl px-4 py-2 text-sm font-medium text-cyan-100 transition hover:-translate-y-0.5 hover:text-white`}
      >
        github.com/is-hiro
      </a>
    </div>
  </div>
);
