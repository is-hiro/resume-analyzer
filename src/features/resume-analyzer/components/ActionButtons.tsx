import styles from "@/features/resume-analyzer/styles.module.css";

type ActionButtonsProps = {
  canAnalyze: boolean;
  hasReport: boolean;
  loading: boolean;
  onAnalyze: () => void;
  onGenerateCoverLetter: () => void;
  onExportMarkdown: () => void;
};

export const ActionButtons = ({
  canAnalyze,
  hasReport,
  loading,
  onAnalyze,
  onGenerateCoverLetter,
  onExportMarkdown,
}: ActionButtonsProps) => (
  <div className="mt-6 flex flex-wrap gap-3">
    <button
      type="button"
      className={`${styles.liquidButton} rounded-xl px-4 py-2 text-sm font-medium`}
      disabled={!canAnalyze || loading}
      onClick={onAnalyze}
    >
      {loading ? "Processing..." : "Analyze Match"}
    </button>
    <button
      type="button"
      className={`${styles.liquidButton} rounded-xl px-4 py-2 text-sm font-medium`}
      disabled={!hasReport || loading}
      onClick={onGenerateCoverLetter}
    >
      Generate Cover Letter
    </button>
    <button
      type="button"
      className={`${styles.liquidButton} rounded-xl px-4 py-2 text-sm font-medium`}
      disabled={!hasReport || loading}
      onClick={onExportMarkdown}
    >
      Export Markdown
    </button>
  </div>
);
