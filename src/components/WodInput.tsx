import type { WodInput as WodInputType } from "@/types/wod";
import styles from "./WodPlanner.module.scss";

type WodInputProps = {
  label: string;
  value: WodInputType;
  onChange: (value: WodInputType) => void;
};

export function WodInput({ label, onChange, value }: WodInputProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>{label}</h2>
        <div className={styles.inputTools}>
          <div className={styles.segmentedControl} aria-label={`${label} 종류`}>
            <button
              className={value.workoutKind === "crossfit" ? styles.segmentActive : undefined}
              type="button"
              onClick={() => onChange({ ...value, workoutKind: "crossfit" })}
            >
              WOD
            </button>
            <button
              className={value.workoutKind === "hyrox" ? styles.segmentActive : undefined}
              type="button"
              onClick={() => onChange({ ...value, workoutKind: "hyrox" })}
            >
              HYROX
            </button>
          </div>
          <input
            aria-label={`${label} 날짜`}
            className={styles.dateInput}
            type="date"
            value={value.date}
            onChange={(event) => onChange({ ...value, date: event.target.value })}
          />
        </div>
      </div>
      <input
        aria-label={`${label} 제목`}
        className={styles.titleInput}
        placeholder="운동 제목"
        value={value.title ?? ""}
        onChange={(event) => onChange({ ...value, title: event.target.value })}
      />
      <textarea
        aria-label={`${label} 텍스트`}
        className={styles.textarea}
        placeholder={"예: 5 rounds for time\n400m run\n20 wall balls\n10 burpees"}
        value={value.rawText}
        onChange={(event) => onChange({ ...value, rawText: event.target.value })}
      />
    </section>
  );
}
