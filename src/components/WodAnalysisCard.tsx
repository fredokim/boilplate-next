import type { ParsedWod } from "@/types/wod";
import styles from "./WodPlanner.module.scss";

type WodAnalysisCardProps = {
  title: string;
  wod: ParsedWod;
};

const workoutKindLabel: Record<ParsedWod["workoutKind"], string> = {
  crossfit: "WOD",
  hyrox: "HYROX",
};

export function WodAnalysisCard({ title, wod }: WodAnalysisCardProps) {
  return (
    <article className={styles.resultCard}>
      <div className={styles.panelHeader}>
        <h2>{title}</h2>
        <span>
          {workoutKindLabel[wod.workoutKind]} · 강도 {wod.estimatedIntensity}/5
        </span>
      </div>
      <div className={styles.movementList}>
        {wod.movements.length > 0 ? (
          wod.movements.map((movement) => (
            <div className={styles.movementItem} key={movement.normalizedName}>
              <strong>{movement.name}</strong>
              <span>{movement.muscleGroups.join(", ")}</span>
            </div>
          ))
        ) : (
          <p className={styles.emptyText}>인식된 동작이 없습니다.</p>
        )}
      </div>
    </article>
  );
}
