import styles from "@/features/resume-analyzer/styles.module.css";

type InputSectionProps = {
  resumeFile: File | null;
  jdText: string;
  onFileChange: (file: File | null) => void;
  onJdChange: (value: string) => void;
};

export const InputSection = ({
  resumeFile,
  jdText,
  onFileChange,
  onJdChange,
}: InputSectionProps) => (
  <section className="mt-6 grid gap-6 md:grid-cols-2">
    <div className={`${styles.glassCard} rounded-3xl p-6`}>
      <h2 className="text-lg font-semibold text-white">1. Resume Upload</h2>
      <p className="mt-1 text-sm text-blue-100/75">Supported: PDF, DOCX, TXT</p>
      <input
        className={`${styles.liquidInput} mt-4 w-full rounded-xl px-3 py-2 text-sm`}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      {resumeFile ? (
        <p className="mt-3 text-sm text-cyan-100/90">Selected: {resumeFile.name}</p>
      ) : null}
    </div>

    <div className={`${styles.glassCard} rounded-3xl p-6`}>
      <h2 className="text-lg font-semibold text-white">2. Job Description</h2>
      <textarea
        className={`${styles.liquidInput} mt-4 h-44 w-full rounded-xl px-3 py-2 text-sm`}
        placeholder="Paste vacancy text here..."
        value={jdText}
        onChange={(event) => onJdChange(event.target.value)}
      />
    </div>
  </section>
);
