import type { FatigueScore } from "@/types/fatigue";
import styles from "./WodPlanner.module.scss";

type WeeklyLoadViewProps = {
  fatigue: FatigueScore;
};

const labels: Record<keyof FatigueScore, string> = {
  quads: "대퇴",
  hamstrings: "햄스트링",
  glutes: "둔근",
  calves: "종아리",
  feet: "발",
  back: "등",
  shoulders: "어깨",
  lower_back: "허리",
  core: "코어",
  conditioning: "컨디셔닝",
};

export function WeeklyLoadView({ fatigue }: WeeklyLoadViewProps) {
  const entries = Object.entries(fatigue) as Array<[keyof FatigueScore, number]>;

  return (
    <article className={styles.resultCard}>
      <div className={styles.panelHeader}>
        <h2>부위별 피로</h2>
        <span>0-30</span>
      </div>
      <div className={styles.loadList}>
        {entries.map(([key, value]) => (
          <div className={styles.loadRow} key={key}>
            <span>{labels[key]}</span>
            <div className={styles.loadTrack}>
              <div className={styles.loadBar} style={{ width: `${Math.min(100, (value / 30) * 100)}%` }} />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
