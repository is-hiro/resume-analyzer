import styles from "@/features/resume-analyzer/styles.module.css";

export const LiquidBackground = () => (
  <div className={styles.liquidBg}>
    <div className={`${styles.liquidOrb} ${styles.liquidOrbA}`} />
    <div className={`${styles.liquidOrb} ${styles.liquidOrbB}`} />
    <div className={`${styles.liquidOrb} ${styles.liquidOrbC}`} />
  </div>
);
